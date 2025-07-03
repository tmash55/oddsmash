#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the current file
const filePath = path.join(__dirname, 'components/hit-rates/v3/hit-rate-dashboard-v3.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Fixing Hit Rates V3 Dashboard...');

// 1. Add missing import
if (!content.includes('import { fetchPlayerTeamData }')) {
  content = content.replace(
    'import { useQueryClient } from "@tanstack/react-query"',
    'import { fetchPlayerTeamData } from "@/services/teams"\nimport { useQueryClient } from "@tanstack/react-query"'
  );
  console.log('✅ Added fetchPlayerTeamData import');
}

// 2. Add playerTeamData state
if (!content.includes('const [playerTeamData')) {
  content = content.replace(
    'const [selectedGames, setSelectedGames] = useState<string[] | null>(null)',
    'const [selectedGames, setSelectedGames] = useState<string[] | null>(null)\n  const [playerTeamData, setPlayerTeamData] = useState<Record<number, PlayerTeamData>>({})'
  );
  console.log('✅ Added playerTeamData state');
}

// 3. Add team data fetching effect
if (!content.includes('Fetch team data when profiles change')) {
  const effectToAdd = `
  // Fetch team data when profiles change
  useEffect(() => {
    const fetchTeamData = async () => {
      if (hitRatesData?.profiles && hitRatesData.profiles.length > 0) {
        const playerIds = hitRatesData.profiles.map((p: PlayerHitRateProfile) => p.player_id)
        
        try {
          const teamData = await fetchPlayerTeamData(playerIds)
          setPlayerTeamData(teamData)
          console.log(\`[HIT RATES V3] Loaded team data for \${Object.keys(teamData).length} players\`)
        } catch (err) {
          console.error("Failed to fetch team data:", err)
        }
      }
    }

    fetchTeamData()
  }, [hitRatesData?.profiles])`;

  content = content.replace(
    '// Reset page when filters change\n  useEffect(() => {',
    effectToAdd + '\n\n  // Reset page when filters change\n  useEffect(() => {'
  );
  console.log('✅ Added team data fetching effect');
}

// 4. Fix hardcoded empty playerTeamData
content = content.replace(
  'playerTeamData={{}} // We\'ll implement this later',
  'playerTeamData={playerTeamData}'
);
console.log('✅ Fixed hardcoded playerTeamData');

// Write the fixed content back
fs.writeFileSync(filePath, content);
console.log('🎉 Fixed Hit Rates V3 Dashboard successfully!');

console.log('\n📋 Summary of fixes:');
console.log('1. Added fetchPlayerTeamData import');
console.log('2. Added playerTeamData state variable');  
console.log('3. Added useEffect to fetch team data when profiles load');
console.log('4. Fixed hardcoded empty playerTeamData object');
console.log('\n✨ The odds should now display properly and team data should load!'); 