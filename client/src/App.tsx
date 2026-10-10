import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';

// --- Type Definitions ---
interface Charity {
  name: string;
  logo: string;
}

interface Slide {
  id: number;
  city: string;
  title: string;
  image: string;
  price: string;
  charities: Charity[];
}

interface CityData {
  name: string;
  color: string;
  charities: Charity[];
}

interface BackendTown {
  id: number;
  townName: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

// URL to your TopoJSON/GeoJSON file (place this in your public folder)
const geoUrl = "/ltla2025.geojson"; 

const App: React.FC = () => {
  // --- State ---
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [townsData, setTownsData] = useState<BackendTown[]>([]);
  
  // Map zoom and pan state
  const [position, setPosition] = useState({
    coordinates: [-2.5, 54.8] as [number, number],
    zoom: 1
  });

  // --- Fetch Data & Geolocation ---
  useEffect(() => {
    // Fetch coordinates from our Express/Sequelize backend
    axios.get('http://localhost:3001/towns')
      .then((response) => {
        setTownsData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching towns:", error);
      });

    // Device location zoom
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            coordinates: [pos.coords.longitude, pos.coords.latitude],
            zoom: 9
          });
        },
        () => {
          // Fallback location if permission denied
          setPosition({
            coordinates: [-2.5873, 53.3900], 
            zoom: 9
          });
        }
      );
    } else {
      setPosition({
        coordinates: [-2.5873, 53.3900], 
        zoom: 9
      });
    }
  }, []);

  // --- Hardcoded UI Data ---
  const slides: Slide[] = [
    {
      id: 1,
      city: 'Manchester',
      title: 'The Industrial Heart',
      image: 'https://picsum.photos/id/175/1200/800', 
      price: '£24.99',
      charities: [
        { name: 'Wood Street Mission', logo: 'https://placehold.co/60x60/2563eb/ffffff?text=WSM' },
        { name: 'Manchester Central Foodbank', logo: 'https://placehold.co/60x60/2563eb/ffffff?text=MCF' },
        { name: 'Mustard Tree', logo: 'https://placehold.co/60x60/2563eb/ffffff?text=MT' }
      ]
    },
    {
      id: 2,
      city: 'Edinburgh',
      title: 'Highland Majesty',
      image: 'https://picsum.photos/id/1040/1200/800', 
      price: '£29.99',
      charities: [
        { name: "Edinburgh Children's Hospital", logo: 'https://placehold.co/60x60/e11d48/ffffff?text=ECH' },
        { name: 'Edinburgh Food 7Yject', logo: 'https://placehold.co/60x60/e11d48/ffffff?text=EFP' },
        { name: 'Streetwork', logo: 'https://placehold.co/60x60/e11d48/ffffff?text=SW' }
      ]
    },
    {
      id: 3,
      city: 'Liverpool',
      title: 'Maritime Legacy',
      image: 'https://picsum.photos/id/124/1200/800', 
      price: '£22.99',
      charities: [
        { name: 'Kind Liverpool', logo: 'https://placehold.co/60x60/16a34a/ffffff?text=KL' },
        { name: 'South Liverpool Foodbank', logo: 'https://placehold.co/60x60/16a34a/ffffff?text=SLF' },
        { name: 'The Whitechapel Centre', logo: 'https://placehold.co/60x60/16a34a/ffffff?text=TWC' }
      ]
    },
    {
      id: 4,
      city: 'Warrington',
      title: 'The Golden Gates',
      image: '/golden-gates.png', 
      price: '£24.99',
      charities: [
        { name: 'Warrington Foodbank', logo: 'https://placehold.co/60x60/8b5cf6/ffffff?text=WF' },
        { name: 'Warrington Youth Zone', logo: 'https://placehold.co/60x60/8b5cf6/ffffff?text=WYZ' },
        { name: "St Rocco's Hospice", logo: 'https://placehold.co/60x60/8b5cf6/ffffff?text=SRH' }
      ]
    }
  ];

  // Store UI data without coordinates
  const cityUIData: CityData[] = [
    { 
      name: 'Edinburgh', color: '#e11d48', 
      charities: [
        { name: "Edinburgh Children's Hospital", logo: 'https://placehold.co/60x60/e11d48/ffffff?text=ECH' },
        { name: 'Edinburgh Food Project', logo: 'https://placehold.co/60x60/e11d48/ffffff?text=EFP' },
        { name: 'Streetwork', logo: 'https://placehold.co/60x60/e11d48/ffffff?text=SW' }
      ] 
    },
    { 
      name: 'Manchester', color: '#2563eb', 
      charities: [
        { name: 'Wood Street Mission', logo: 'https://placehold.co/60x60/2563eb/ffffff?text=WSM' },
        { name: 'Manchester Central Foodbank', logo: 'https://placehold.co/60x60/2563eb/ffffff?text=MCF' },
        { name: 'Mustard Tree', logo: 'https://placehold.co/60x60/2563eb/ffffff?text=MT' }
      ] 
    },
    { 
      name: 'Liverpool', color: '#16a34a', 
      charities: [
        { name: 'Kind Liverpool', logo: 'https://placehold.co/60x60/16a34a/ffffff?text=KL' },
        { name: 'South Liverpool Foodbank', logo: 'https://placehold.co/60x60/16a34a/ffffff?text=SLF' },
        { name: 'The Whitechapel Centre', logo: 'https://placehold.co/60x60/16a34a/ffffff?text=TWC' }
      ] 
    },
    {
      name: 'Warrington', color: '#8b5cf6', // A purple pin
      charities: [
        { name: 'Warrington Foodbank', logo: 'https://placehold.co/60x60/8b5cf6/ffffff?text=WF' },
        { name: 'Warrington Youth Zone', logo: 'https://placehold.co/60x60/8b5cf6/ffffff?text=WYZ' },
        { name: "St Rocco's Hospice", logo: 'https://placehold.co/60x60/8b5cf6/ffffff?text=SRH' }
      ]
    }
  ];

  // Merge the fetched coordinates with our local UI data
  const mergedCities = cityUIData.map(city => {
    const backendData = townsData.find(t => t.townName === city.name);
    return {
      ...city,
      // Group the ternary statement and cast the entire result as a tuple
      coordinates: (backendData 
        ? [backendData.longitude, backendData.latitude] 
        : [0, 0]) as [number, number]
    };
  }).filter(city => city.coordinates[0] !== 0); // Only render if we have coordinates

  const navLinks: string[] = ['Home', 'Products', 'Information'];

  // --- Effects & Handlers ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="min-h-screen bg-[#fdfbf7] font-sans text-gray-800">
      
      {/* Header Section */}
      <header className="pt-12 pb-6 px-6 text-center shadow-sm bg-white">
        <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 tracking-tight mb-2">
          Provi-22222222Prints
        </h1>
        <p className="text-xl text-gray-800 font-serif tracking-wide mt-3 mb-5">
          Providing <span className="text-base text-gray-400 italic font-light mx-1">for your</span> 
          Province <span className="text-base text-gray-400 italic font-light mx-1">through</span> 
          Prints
        </p>
        
        {/* Literal Description */}
        <div className="flex justify-center items-center gap-3 text-[10px] md:text-xs text-gray-400 uppercase tracking-[0.25em] font-semibold">
           <span className="h-[1px] w-8 md:w-16 bg-gray-200"></span>
           Vintage-Inspired Travel Posters of the UK
           <span className="h-[1px] w-8 md:w-16 bg-gray-200"></span>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-[#2c3e50] text-white sticky top-0 z-20 shadow-md">
        <ul className="flex justify-center space-x-8 md:space-x-16 py-4 px-6 text-sm md:text-base uppercase tracking-wider font-semibold">
          {navLinks.map((link) => (
            <li key={link}>
              <button className="hover:text-[#e9c46a] transition-colors duration-300 focus:outline-none pb-1 border-b-2 border-transparent hover:border-[#e9c46a]">
                {link}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Featured Products Slideshow */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="relative overflow-hidden rounded-xl shadow-2xl bg-gray-900 group" style={{ height: '500px' }}>
          
          {/* Slides */}
          {slides.map((slide, index) => (
            <div 
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              <img 
                src={slide.image} 
                alt={`Vintage poster of ${slide.city}`} 
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; 
                  target.src = `https://placehold.co/1200x800/2c3e50/e9c46a?text=${slide.city}+Poster`;
                }}
                className="w-full h-full object-cover opacity-80"
                style={{ 
                  filter: 'sepia(60%) contrast(120%) saturate(80%) hue-rotate(-5deg)',
                  transform: 'scale(1.062)' 
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-10">
                <div className="transform transition-all duration-700 translate-y-0">
                  <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold tracking-wider text-gray-900 uppercase bg-[#e9c46a] rounded-full">
                    Featured Print
                  </span>
                  <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2 drop-shadow-lg">
                    {slide.city}
                  </h2>
                  <p className="text-xl text-gray-200 mb-2 font-light italic">
                    "{slide.title}"
                  </p>
                  <div className="mb-4">
                    <p className="text-sm text-[#e9c46a] font-semibold tracking-wide flex items-center gap-2 mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                      Profits support your choice of local charities:
                    </p>
                    
                    <div className="flex flex-wrap gap-3 pl-7 mt-2 mb-4">
                      {slide.charities.map((charity, i) => (
                        <div key={i} className="flex items-center gap-2 bg-black/40 rounded-full pr-3 p-1 border border-white/10 shadow-sm hover:bg-black/60 transition-colors cursor-default">
                          <img src={charity.logo} alt={`${charity.name} logo`} className="w-6 h-6 rounded-full bg-white" />
                          <span className="text-xs text-gray-200 font-medium whitespace-nowrap">{charity.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between max-w-sm">
                    <span className="text-2xl font-bold text-white">{slide.price}</span>
                    <button className="px-6 py-2 bg-white text-gray-900 font-bold rounded hover:bg-gray-200 transition-colors shadow-lg">
                      Shop Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Controls */}
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all focus:outline-none ${index === currentSlide ? 'bg-[#e9c46a] w-8' : 'bg-white/50 hover:bg-white/80'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area (Map and Text) */}
      <main className="max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-12 border-t border-gray-200">
        
        {/* Text/Info Side */}
        <div className="md:w-1/2 space-y-6 text-center md:text-left">
          <h2 className="text-3xl font-serif font-bold text-gray-800">
            Explore Your Favourite Spots
          </h2>
          <p className="text-gray-600 leading-relaxed text-lg">
            Discover our curated collection of vintage-inspired posters. From the bustling streets of Manchester to the historic charm of Edinburgh, find the perfect print to celebrate the places you love.
          </p>
          <p className="text-sm text-gray-500 italic">
            Hover over a pin on the map to see more...
          </p>
          
          {/* Dynamic display based on hover */}
          <div className="min-h-[160px] mt-8 p-6 bg-white rounded-lg shadow-inner border border-gray-100 flex flex-col items-center justify-center transition-all duration-300">
             {hoveredCity ? (
               <div className="w-full text-center flex flex-col items-center">
                 <p className="text-xl font-bold text-gray-800 mb-3">
                   Explore <span className="text-[#e9c46a]">{hoveredCity}</span> Prints
                 </p>
                 <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-100 w-full max-w-xs text-left">
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-200">
                      <span className="text-red-500">♥</span> Supports your choice of:
                    </p>
                    
                    <ul className="space-y-2.5 mt-2">
                      {cityUIData.find(c => c.name === hoveredCity)?.charities.map((charity, i) => (
                        <li key={i} className="flex items-center gap-3 group">
                          <img src={charity.logo} alt={`${charity.name} logo`} className="w-7 h-7 rounded-full border border-gray-200 shadow-sm group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-medium text-gray-700">{charity.name}</span>
                        </li>
                      ))}
                    </ul>
                 </div>
               </div>
             ) : (
               <p className="text-gray-400">Select a city on the map</p>
             )}
          </div>
        </div>

        {/* Map Side */}
        <div className="md:w-1/2 w-full max-w-lg relative flex justify-center">
          <ComposableMap
            projection="geoMercator"
            width={700}
            height={950}
            projectionConfig={{
              scale: 3300,
              center: [-2.5, 54.8]
            }}
            className="w-full h-auto drop-shadow-xl focus:outline-none rounded-3xl overflow-hidden"
          >
            <ZoomableGroup
              zoom={position.zoom}
              center={position.coordinates}
              onMoveEnd={(pos) => setPosition(pos as any)}
            >
              {/* Render the Map Path */}
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#d1d5db"
                      stroke="#d1d5db"
                      strokeWidth={0.5} 
                      tabIndex={-1} 
                      className="focus:outline-none"
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#9ca3af", stroke: "#9ca3af", outline: "none", cursor: "default" },
                        pressed: { outline: "none" }
                      } as any}
                    />
                  ))
                }
              </Geographies>

              {/* Render the Dynamic Pins */}
              {mergedCities.map((city) => (
                <Marker 
                  key={city.name} 
                  coordinates={city.coordinates}
                  onMouseEnter={() => setHoveredCity(city.name)}
                  onMouseLeave={() => setHoveredCity(null)}
                  className="cursor-pointer group focus:outline-none"
                >
                  {/* Wrapper scale inverses the zoom level so pins stay exactly the same visual size */}
                  <g transform={`scale(${1 / position.zoom})`}>
                    
                    {/* Transparent expanded hit area for easier hover/click detection. */}
                    <circle cx="0" cy="-28" r="45" fill="transparent" />

                    {/* Added drop-shadow-md here so both the pin body and extended pill cast a shadow seamlessly as one object */}
                    <g className="transition-transform duration-300 ease-out origin-bottom group-hover:scale-125 drop-shadow-md">
                      
                      {/* Base Pin Stem */}
                      <path
                        d="M 0 0 C 8 -10 12 -20 12 -28 C 12 -36 6 -40 0 -40 C -6 -40 -12 -36 -12 -28 C -12 -20 -8 -10 0 0 Z"
                        fill={city.color}
                      />
                      
                      {/* Seamless curved background pill specifically for the text width. Scaled up for the 50% larger text */}
                      <rect 
                        x="-55" 
                        y="-43" 
                        width="110" 
                        height="30" 
                        rx="15" 
                        fill={city.color} 
                      />
                      
                      {/* Text vertically dead center of the extended curved pill, white with bold black outline. Increased font size by 50% */}
                      <text
                        x="0"
                        y="-28" 
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        dominantBaseline="central"
                        className="text-[17.25px] font-bold pointer-events-none"
                        style={{
                          fill: 'white',
                          stroke: 'black',
                          strokeWidth: '2.5px',
                          strokeLinejoin: 'round',
                          paintOrder: 'stroke fill', // Ensures the black stroke draws strictly *behind* the white fill
                        }}
                      >
                        {city.name}
                      </text>
                    </g>
                  </g>
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        </div>
      </main>
      
      <footer className="bg-gray-100 py-8 text-center text-gray-500 text-sm mt-auto">
        <p>&copy; {new Date().getFullYear()} Provi Prints. All rights reserved.</p>
        <p className="mt-2">Bringing vintage charm to modern walls.</p>
      </footer>
    </div>
  );
};

export default App;