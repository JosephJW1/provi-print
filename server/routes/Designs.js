const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Design, Towns } = require('../models');
const { validateToken, isAdmin } = require('../middlewares/AuthMiddleware');
const {
  uploadNewDesignAssets,
  getTemporaryMasterDownloadUrl,
  deleteDesignAssets,
} = require('../services/storageService');

// Configure multer to hold high-res master uploads in RAM buffer (up to 60MB for 300 DPI masters)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 60 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/tiff'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPEG, WebP, and TIFF master files are allowed.'));
    }
  },
});

// Helper to parse townIds from multipart/form-data or JSON body
function parseTownIds(rawTownIds) {
  if (!rawTownIds) return [];
  if (Array.isArray(rawTownIds)) {
    return rawTownIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id));
  }
  try {
    const parsed = JSON.parse(rawTownIds);
    if (Array.isArray(parsed)) {
      return parsed.map((id) => Number(id)).filter((id) => !Number.isNaN(id));
    }
  } catch {
    // Fallback for comma-separated or single ID string
  }
  return String(rawTownIds)
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((id) => !Number.isNaN(id) && id > 0);
}

// Helper to return safe client error messages without leaking internal DB/SDK internals
function getSafeErrorResponse(error, fallbackMessage) {
  if (error instanceof Error && error.isClientSafe) {
    return { status: error.statusCode || 400, message: error.message };
  }
  return { status: 500, message: fallbackMessage };
}

// Public attributes — strictly excludes `privateMasterKey` and `publicPreviewKey`
const PUBLIC_DESIGN_ATTRIBUTES = ['id', 'title', 'description', 'image_url', 'createdAt', 'updatedAt'];

// Get all designs (Public - anyone viewing the store; never exposes privateMasterKey)
router.get('/', async (req, res) => {
  try {
    const designs = await Design.findAll({
      attributes: PUBLIC_DESIGN_ATTRIBUTES,
      include: [
        {
          model: Towns,
          attributes: ['id', 'townName', 'latitude', 'longitude'],
          through: { attributes: [] },
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(designs);
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
});

// Get a single design by ID (Public - never exposes privateMasterKey)
router.get('/:id', async (req, res) => {
  try {
    const design = await Design.findByPk(req.params.id, {
      attributes: PUBLIC_DESIGN_ATTRIBUTES,
      include: [
        {
          model: Towns,
          attributes: ['id', 'townName', 'latitude', 'longitude'],
          through: { attributes: [] },
        },
      ],
    });

    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }

    res.json(design);
  } catch (error) {
    console.error('Error fetching design:', error);
    res.status(500).json({ error: 'Failed to fetch design' });
  }
});

// Add a new design with high-res master upload to R2 (Private - Admin Only)
router.post('/', validateToken, isAdmin, upload.single('masterImage'), async (req, res) => {
  const { title, description, townIds } = req.body;

  if (!title || !String(title).trim() || String(title).trim().length > 255) {
    return res.status(400).json({ error: 'Design title is required (max 255 characters)' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'High-resolution master image file is required' });
  }

  try {
    // 1. Resize + watermark preview with Sharp and upload both files to Cloudflare R2
    const { image_url, publicPreviewKey, privateMasterKey } = await uploadNewDesignAssets(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // 2. Create Design record in MySQL
    const design = await Design.create({
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      image_url,
      publicPreviewKey,
      privateMasterKey,
    });

    // 3. Link associated Towns via DesignTowns junction table
    const parsedIds = parseTownIds(townIds);
    if (parsedIds.length > 0) {
      const towns = await Towns.findAll({ where: { id: parsedIds } });
      await design.setTowns(towns);
    }

    const createdWithTowns = await Design.findByPk(design.id, {
      attributes: PUBLIC_DESIGN_ATTRIBUTES,
      include: [
        {
          model: Towns,
          attributes: ['id', 'townName', 'latitude', 'longitude'],
          through: { attributes: [] },
        },
      ],
    });

    res.status(201).json({
      message: 'Design created successfully',
      design: createdWithTowns,
    });
  } catch (error) {
    console.error('Error creating design:', error);
    const { status, message } = getSafeErrorResponse(error, 'Failed to create design');
    res.status(status).json({ error: message });
  }
});

// Edit an existing design (Private - Admin Only; optionally replaces master & preview image)
router.put('/:id', validateToken, isAdmin, upload.single('masterImage'), async (req, res) => {
  const designId = req.params.id;
  const { title, description, townIds } = req.body;

  if (title !== undefined && (!String(title).trim() || String(title).trim().length > 255)) {
    return res.status(400).json({ error: 'Design title must be between 1 and 255 characters' });
  }

  try {
    const design = await Design.findByPk(designId);

    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }

    const updatedFields = {
      title: title !== undefined ? String(title).trim() : design.title,
      description: description !== undefined ? String(description).trim() : design.description,
    };

    // If a new master image file was uploaded, process it and clean up the old R2 objects
    if (req.file) {
      const oldPublicKey = design.publicPreviewKey;
      const oldPrivateKey = design.privateMasterKey;

      const { image_url, publicPreviewKey, privateMasterKey } = await uploadNewDesignAssets(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      updatedFields.image_url = image_url;
      updatedFields.publicPreviewKey = publicPreviewKey;
      updatedFields.privateMasterKey = privateMasterKey;

      if (oldPublicKey || oldPrivateKey) {
        await deleteDesignAssets(oldPublicKey, oldPrivateKey).catch((err) =>
          console.warn('Warning: Failed to delete old R2 assets during design update:', err)
        );
      }
    }

    await design.update(updatedFields);

    if (townIds !== undefined) {
      const parsedIds = parseTownIds(townIds);
      const towns = parsedIds.length > 0 ? await Towns.findAll({ where: { id: parsedIds } }) : [];
      await design.setTowns(towns);
    }

    const updatedWithTowns = await Design.findByPk(design.id, {
      attributes: PUBLIC_DESIGN_ATTRIBUTES,
      include: [
        {
          model: Towns,
          attributes: ['id', 'townName', 'latitude', 'longitude'],
          through: { attributes: [] },
        },
      ],
    });

    res.json({
      message: 'Design updated successfully',
      design: updatedWithTowns,
    });
  } catch (error) {
    console.error('Error updating design:', error);
    const { status, message } = getSafeErrorResponse(error, 'Failed to update design');
    res.status(status).json({ error: message });
  }
});

// Generate a temporary 15-minute presigned download URL for the private 300 DPI master (Admin Only)
router.get('/:id/master-download', validateToken, isAdmin, async (req, res) => {
  try {
    const design = await Design.findByPk(req.params.id);

    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }

    if (!design.privateMasterKey) {
      return res.status(404).json({
        error: 'No private master file key is stored for this design',
      });
    }

    const expiresInSeconds = 900; // 15 minutes
    const downloadUrl = await getTemporaryMasterDownloadUrl(
      design.privateMasterKey,
      expiresInSeconds
    );

    res.json({
      designId: design.id,
      title: design.title,
      downloadUrl,
      expiresInSeconds,
    });
  } catch (error) {
    console.error('Error generating master download URL:', error);
    const { status, message } = getSafeErrorResponse(error, 'Failed to generate master download URL');
    res.status(status).json({ error: message });
  }
});

// Delete a design and its R2 bucket objects (Private - Admin Only)
router.delete('/:id', validateToken, isAdmin, async (req, res) => {
  const designId = req.params.id;

  try {
    const design = await Design.findByPk(designId);

    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }

    if (design.publicPreviewKey || design.privateMasterKey) {
      try {
        await deleteDesignAssets(design.publicPreviewKey, design.privateMasterKey);
      } catch (r2Error) {
        console.warn(
          `Warning: Failed to delete R2 assets for design ${design.id} (continuing DB deletion):`,
          r2Error
        );
      }
    }

    await design.destroy();
    res.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Error deleting design:', error);
    res.status(500).json({ error: 'Failed to delete design' });
  }
});

module.exports = router;
