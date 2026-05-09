const fs = require('fs');

let content = fs.readFileSync('src/pages/UserApp.tsx', 'utf-8');

content = content.replace(
  'import { IzinMenuView } from \'./views/IzinMenuView\';',
  'import { IzinMenuView } from \'./views/IzinMenuView\';\nimport { useUserLocation } from \'../hooks/useUserLocation\';'
);

const lines = content.split('\n');
let newLines = [];
let skipMode = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes('const [location, setLocation] = useState')) {
     newLines.push('  const { location, distance, isWithinRadius, locationError, isFakeGPS, currentAreaName, setIsWithinRadius } = useUserLocation(settings, user);');
     skipMode = true;
     // don't skip the other things we want to keep
  }
  
  if (skipMode) {
      if (line.includes('const [distance, setDistance] = ')) continue;
      if (line.includes('const [isWithinRadius, setIsWithinRadius] = ')) continue;
      if (line.includes('const [locationError, setLocationError] = ')) continue;
      if (line.includes('const [isFakeGPS, setIsFakeGPS] = ')) continue;
      if (line.includes('const [currentAreaName, setCurrentAreaName] = ')) continue;
      if (line.includes('lastPosRef = useRef')) continue;
      
      // Stop skipping if we hit the geofence effect start
      if (line.includes('useEffect(() => {') && lines[i+1].includes('if (!settings) return;')) {
          // This is the effect we want to skip perfectly
      } else if (line.includes('  }, [settings]);')) {
          skipMode = false;
          continue;
      } else if (
          line.includes('const [isCardExpanded, ') ||
          line.includes('const [isAbsenMapExpanded, ') ||
          line.includes('const [loading, ') ||
          line.includes('const [view, ') ||
          line.includes('const [profileTab, ') ||
          line.includes('const [summaryModalCategory, ') ||
          line.includes('const [idCardSide, ') ||
          line.includes('const [editName, ') ||
          line.includes('const [editPhone, ') ||
          line.includes('const [editFaceBase64, ') ||
          line.includes('const [fcmVapidKey, ') ||
          line.includes('const [showFcmSetup, ') ||
          line.includes('const [isOnline, ') ||
          line.includes('const handleOnline = ') ||
          line.includes('const handleOffline = ') ||
          
          line.includes('useEffect(() => {') && lines[i+1]?.includes('const handleOnline')
      ) {
          // But wait, the geofence effect is way further down!
      }
  }
  
  if (!skipMode) {
      newLines.push(line);
  }
}

fs.writeFileSync('src/pages/UserApp.tsx.temp', newLines.join('\n'));
console.log("Done");
