/**
 * Bhoomi-Drishti Real GIS Cadastral Data Seeder
 * 
 * Fetches real polygon geometries from OpenStreetMap (Overpass API)
 * across 5 major Indian states (MP, MH, UP, RJ, KA), maps them to the
 * PostGIS land_records schema, and populates the database.
 * 
 * Usage: node scripts/seed-osm-land-records.js
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const CACHE_DIR = path.join(DATA_DIR, 'osm_cache');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// Overpass API public endpoints with failover
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// Target regions across 5 Indian states
const TARGET_REGIONS = [
  // ── Madhya Pradesh (Central India & Default Viewport) ─────────────────────
  {
    state: 'Madhya Pradesh',
    stateCode: 'MP',
    district: 'Bhopal',
    distCode: 'BPL',
    tehsil: 'Huzur',
    villages: ['Kolar', 'Berasia', 'Misrod', 'Bairagarh', 'Gandhinagar', 'Baghmugaliya'],
    bbox: '23.18,77.34,23.32,77.48',
    limit: 60,
  },
  {
    state: 'Madhya Pradesh',
    stateCode: 'MP',
    district: 'Sehore',
    distCode: 'SEH',
    tehsil: 'Phanda',
    villages: ['Bilkisganj', 'Doraha', 'Shyampur', 'Ichhawar', 'Ashta Rural'],
    bbox: '23.14,77.02,23.25,77.16',
    limit: 30,
  },
  {
    state: 'Madhya Pradesh',
    stateCode: 'MP',
    district: 'Indore',
    distCode: 'IND',
    tehsil: 'Rau',
    villages: ['Rau Kalan', 'Pithampur Border', 'Mhow Rural', 'Depalpur', 'Sanwer'],
    bbox: '22.65,75.80,22.76,75.92',
    limit: 50,
  },

  // ── Maharashtra ───────────────────────────────────────────────────────────
  {
    state: 'Maharashtra',
    stateCode: 'MH',
    district: 'Pune',
    distCode: 'PUN',
    tehsil: 'Haveli',
    villages: ['Hadapsar Rural', 'Wagholi', 'Khadakwasla', 'Hinjavadi', 'Pirangut'],
    bbox: '18.48,73.78,18.58,73.94',
    limit: 50,
  },
  {
    state: 'Maharashtra',
    stateCode: 'MH',
    district: 'Nashik',
    distCode: 'NSK',
    tehsil: 'Dindori',
    villages: ['Girnare', 'Trimbak Rural', 'Vani', 'Pimpalgaon', 'Ozhar'],
    bbox: '19.95,73.70,20.08,73.85',
    limit: 35,
  },

  // ── Uttar Pradesh ─────────────────────────────────────────────────────────
  {
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    district: 'Lucknow',
    distCode: 'LKO',
    tehsil: 'Mohanlalganj',
    villages: ['Bakshi Ka Talab', 'Gosainganj', 'Kakori', 'Chinhat Rural', 'Sarojini Nagar'],
    bbox: '26.78,80.88,26.90,81.02',
    limit: 50,
  },
  {
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    district: 'Varanasi',
    distCode: 'VNS',
    tehsil: 'Pindra',
    villages: ['Harahua', 'Cholapur', 'Shivpur Rural', 'Kashi Vidyapeeth', 'Babatpur'],
    bbox: '25.30,82.92,25.42,83.06',
    limit: 35,
  },

  // ── Rajasthan ─────────────────────────────────────────────────────────────
  {
    state: 'Rajasthan',
    stateCode: 'RJ',
    district: 'Jaipur',
    distCode: 'JPR',
    tehsil: 'Sanganer',
    villages: ['Bagru Rural', 'Chaksu', 'Bassi', 'Amer Rural', 'Jhotwara'],
    bbox: '26.80,75.74,26.92,75.88',
    limit: 50,
  },
  {
    state: 'Rajasthan',
    stateCode: 'RJ',
    district: 'Alwar',
    distCode: 'ALW',
    tehsil: 'Ramgarh',
    villages: ['Kishangarh Bas', 'Tijara', 'Behror Rural', 'Thanagazi', 'Mandawar'],
    bbox: '27.50,76.54,27.62,76.70',
    limit: 35,
  },

  // ── Karnataka ─────────────────────────────────────────────────────────────
  {
    state: 'Karnataka',
    stateCode: 'KA',
    district: 'Bengaluru Rural',
    distCode: 'BLR',
    tehsil: 'Devanahalli',
    villages: ['Doddaballapur', 'Hoskote', 'Vijayapura', 'Nelamangala', 'Kundana'],
    bbox: '13.18,77.62,13.30,77.76',
    limit: 50,
  },
  {
    state: 'Karnataka',
    stateCode: 'KA',
    district: 'Mysuru',
    distCode: 'MYS',
    tehsil: 'Nanjangud',
    villages: ['Hunsur Rural', 'Bannur', 'T. Narasipura', 'Varuna', 'Chamundi Foothills'],
    bbox: '12.24,76.60,12.36,76.74',
    limit: 35,
  },
];

// Names database by region
const OWNER_NAMES = {
  MP: [
    'Ramesh Chandra Patel', 'Suresh Kumar Verma', 'Vikram Singh Chouhan',
    'Sunita Bai Rajput', 'Devendra Yadav', 'Kailash Gurjar',
    'Santosh Malviya', 'Radhey Shyam Tiwari', 'Rajeshwari Sharma',
    'Mohan Lal Lodhi', 'Anita Bai Meena', 'Dharmendra Parmar',
    'Babulal Mewada', 'Ganga Prasad Soni', 'Kamlesh Baghel'
  ],
  MH: [
    'Dnyaneshwar Shivaji Patil', 'Sanjay Anandrao Shinde', 'Sunita Ramchandra Pawar',
    'Ganesh Tukaram Deshmukh', 'Ashok Balasaheb Jadhav', 'Vandana Vithal Kadam',
    'Pravin Baburao Gaikwad', 'Sachin Dattatray More', 'Usha Narayan Chavan',
    'Nilesh Pandurang Bhosale', 'Eknath Sopan Giramkar', 'Meena Suresh Thorat'
  ],
  UP: [
    'Ram Asrey Shukla', 'Brijesh Kumar Mishra', 'Chandrapal Singh Yadav',
    'Shanti Devi Tiwari', 'Rakesh Kumar Pandey', 'Awadhesh Pratap Singh',
    'Kusum Lata Srivastava', 'Dinesh Kumar Maurya', 'Sunil Kumar Verma',
    'Kamla Kant Tripathi', 'Rajesh Bahadur Singh', 'Manju Devi Chauhan'
  ],
  RJ: [
    'Ramphool Meena', 'Kishan Lal Sharma', 'Bhagwan Sahay Gurjar',
    'Santra Devi Jat', 'Gordhan Singh Rathore', 'Moolchand Saini',
    'Tara Chand Choudhary', 'Geeta Bai Rajput', 'Bhanwar Lal Kumawat',
    'Mukesh Kumar Yadav', 'Shaitan Singh Shekhawat', 'Parvati Devi Bishnoi'
  ],
  KA: [
    'Venkatesh Gowda', 'Muniraju B.C.', 'Manjunatha Swamy',
    'Lakshmamma N.', 'Ramesh Kumar Hegde', 'Chandrashekarappa',
    'Shilpa Shivananda', 'Basavaraju S.', 'Krishnappa Reddy',
    'Anjinappa Gowda', 'Renukamma M.', 'Gopalakrishna Bhat'
  ]
};

const COMMERCIAL_ENTITIES = [
  'Kisan Agro Warehousing Corp',
  'Shree Ram Logistics Park',
  'Krishi Vikas Agri Processing Ltd',
  'Bharat Cold Storage & Logistics',
  'Sardar Patel Agro Traders',
  'Kaveri Grain Silos Ltd',
  'Deccan Sugar & Food Products',
  'Bhoomi Bio-Fertilizers Ltd',
  'Chambal Seeds & Fertilizers',
  'Narmada Agro Bio-Tech'
];

/**
 * Maps OSM landuse/natural/amenity tags to the schema enum:
 * 'AGRICULTURAL' | 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'GOVERNMENT' | 'FOREST' | 'OTHER'
 */
function mapOsmToLandUse(tags = {}) {
  const lu = (tags.landuse || '').toLowerCase().trim();
  const nat = (tags.natural || '').toLowerCase().trim();
  const leisure = (tags.leisure || '').toLowerCase().trim();
  const amenity = (tags.amenity || '').toLowerCase().trim();

  if (['farmland', 'farm', 'orchard', 'vineyard', 'meadow', 'greenhouse_horticulture', 'plant_nursery'].includes(lu)) {
    return 'AGRICULTURAL';
  }
  if (['residential', 'village_green', 'allotments'].includes(lu)) {
    return 'RESIDENTIAL';
  }
  if (['commercial', 'retail'].includes(lu) || ['marketplace', 'bank'].includes(amenity)) {
    return 'COMMERCIAL';
  }
  if (['industrial', 'quarry', 'depot', 'harbour', 'port', 'landfill', 'construction'].includes(lu)) {
    return 'INDUSTRIAL';
  }
  if (
    ['institutional', 'civic_admin', 'government', 'military', 'education', 'hospital'].includes(lu) ||
    ['police', 'townhall', 'courthouse', 'post_office', 'school', 'college', 'university', 'hospital'].includes(amenity)
  ) {
    return 'GOVERNMENT';
  }
  if (['forest', 'wood'].includes(lu) || ['wood', 'tree_row'].includes(nat) || ['nature_reserve'].includes(leisure)) {
    return 'FOREST';
  }
  if (['grass', 'recreation_ground', 'cemetery', 'park'].includes(lu) || ['park', 'garden', 'pitch'].includes(leisure)) {
    return 'OTHER';
  }

  // Default fallback if tags unspecified
  return 'AGRICULTURAL';
}

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch Overpass data with endpoint rotation and retry backoff
 */
async function fetchOverpassWithRetry(query, regionName) {
  const cacheFile = path.join(CACHE_DIR, `osm_${regionName.replace(/[^a-zA-Z0-9]/g, '_')}.json`);

  if (fs.existsSync(cacheFile)) {
    console.log(`  [Cache Hit] Loading ${regionName} from local cache.`);
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  }

  for (let attempt = 0; attempt < OVERPASS_ENDPOINTS.length * 2; attempt++) {
    const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length];
    try {
      console.log(`  [Fetch] Querying ${regionName} via ${new URL(endpoint).hostname}...`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'BhoomiDrishti-Cadastre-Seeder/1.0 (GIS Land Governance Platform)',
        },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(30000),
      });

      if (res.status === 429 || res.status === 504) {
        console.warn(`    Endpoint returned status ${res.status}, waiting 3s before retry...`);
        await sleep(3000);
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const text = await res.text();
      if (!text.startsWith('{')) {
        throw new Error(`Response was not JSON: ${text.substring(0, 100)}`);
      }

      const json = JSON.parse(text);
      fs.writeFileSync(cacheFile, JSON.stringify(json, null, 2), 'utf8');
      console.log(`    Successfully fetched and cached ${json.elements ? json.elements.length : 0} elements.`);
      return json;
    } catch (err) {
      console.warn(`    Attempt ${attempt + 1} failed (${err.message}). Retrying...`);
      await sleep(2000);
    }
  }

  throw new Error(`Failed to fetch data for ${regionName} after multiple retries.`);
}

/**
 * Converts OSM way coordinates to PostGIS WKT POLYGON string.
 * Returns null if geometry cannot form a valid closed polygon ring.
 */
function wayGeometryToWkt(geometry) {
  if (!geometry || !Array.isArray(geometry) || geometry.length < 3) {
    return null;
  }

  // Deduplicate consecutive identical points
  const clean = [];
  for (let i = 0; i < geometry.length; i++) {
    const pt = geometry[i];
    if (typeof pt.lat !== 'number' || typeof pt.lon !== 'number') continue;
    if (clean.length > 0) {
      const prev = clean[clean.length - 1];
      if (Math.abs(prev.lat - pt.lat) < 1e-7 && Math.abs(prev.lon - pt.lon) < 1e-7) {
        continue;
      }
    }
    clean.push(pt);
  }

  if (clean.length < 3) return null;

  // Ensure closed ring (first point == last point)
  const first = clean[0];
  const last = clean[clean.length - 1];
  if (Math.abs(first.lat - last.lat) > 1e-7 || Math.abs(first.lon - last.lon) > 1e-7) {
    clean.push(first);
  }

  if (clean.length < 4) return null;

  // WKT format: lon lat (X Y)
  const coordsStr = clean.map((pt) => `${pt.lon.toFixed(7)} ${pt.lat.toFixed(7)}`).join(', ');
  return `POLYGON((${coordsStr}))`;
}

/**
 * Escapes a single-quoted SQL string
 */
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

/**
 * Main seeding workflow
 */
async function main() {
  console.log('================================================================');
  console.log('   BHOOMI-DRISHTI: Real OSM Land Parcel Seeder');
  console.log('   Connecting to Overpass API -> PostGIS (Docker)');
  console.log('================================================================\n');

  const recordsToInsert = [];
  let parcelCounter = 1000;

  for (const reg of TARGET_REGIONS) {
    const regionLabel = `${reg.state} - ${reg.district} (${reg.tehsil})`;
    console.log(`\nProcessing Region: ${regionLabel}`);

    // Query Overpass for ways with landuse, natural, amenity, or leisure
    const query = `
      [out:json][timeout:25];
      (
        way["landuse"](${reg.bbox});
        way["leisure"="park"](${reg.bbox});
        way["amenity"~"school|hospital|university"](${reg.bbox});
      );
      out geom ${reg.limit};
    `;

    try {
      const osmData = await fetchOverpassWithRetry(query, `${reg.stateCode}_${reg.distCode}`);
      const elements = (osmData.elements || []).filter((e) => e.type === 'way' && e.geometry);
      console.log(`  Parsing ${elements.length} OSM ways into cadastral parcels...`);

      let parsedCount = 0;
      for (const way of elements) {
        const wkt = wayGeometryToWkt(way.geometry);
        if (!wkt) continue;

        parcelCounter++;
        const id = crypto.randomUUID();
        const landUseType = mapOsmToLandUse(way.tags);

        // Village assignment
        const village =
          way.tags['addr:village'] ||
          way.tags['addr:suburb'] ||
          reg.villages[parsedCount % reg.villages.length];

        // Survey number (khasra format: e.g. 142/1)
        const khasraMain = (way.id % 450) + 1;
        const khasraSub = (way.id % 5) + 1;
        const surveyNumber = `${khasraMain}/${khasraSub}`;

        // Parcel identifier
        const parcelNumber = `${reg.stateCode}-${reg.distCode}-${String(khasraMain).padStart(3, '0')}-${parcelCounter}`;

        // Determine ownership and owner name
        let ownershipType = 'INDIVIDUAL';
        let ownerName = '';

        if (landUseType === 'GOVERNMENT') {
          ownershipType = 'GOVERNMENT';
          ownerName = way.tags.name || `${reg.state} State Revenue Dept`;
        } else if (landUseType === 'FOREST') {
          ownershipType = 'GOVERNMENT';
          ownerName = `${reg.state} Forest Department`;
        } else if (landUseType === 'COMMERCIAL' || landUseType === 'INDUSTRIAL') {
          ownershipType = parsedCount % 3 === 0 ? 'JOINT' : 'INDIVIDUAL';
          ownerName =
            way.tags.name ||
            COMMERCIAL_ENTITIES[parsedCount % COMMERCIAL_ENTITIES.length];
        } else {
          // AGRICULTURAL or RESIDENTIAL
          ownershipType = parsedCount % 4 === 0 ? 'JOINT' : 'INDIVIDUAL';
          const namePool = OWNER_NAMES[reg.stateCode] || OWNER_NAMES.MP;
          ownerName = namePool[parsedCount % namePool.length];
          if (ownershipType === 'JOINT') {
            const coOwner = namePool[(parsedCount + 3) % namePool.length];
            ownerName = `${ownerName} & ${coOwner}`;
          }
        }

        // Masked Aadhaar demo identifier
        const ownerIdentifier = `XXXX-XXXX-${String((way.id % 9000) + 1000)}`;

        // Status: 92% ACTIVE (publicly visible), 4% PENDING_VERIFICATION, 4% DISPUTED
        const rand = parsedCount % 100;
        let status = 'ACTIVE';
        if (rand < 4) status = 'DISPUTED';
        else if (rand < 8) status = 'PENDING_VERIFICATION';

        recordsToInsert.push({
          id,
          parcelNumber,
          surveyNumber,
          state: reg.state,
          district: reg.district,
          tehsil: reg.tehsil,
          village,
          landUseType,
          ownershipType,
          ownerName: ownerName.substring(0, 120),
          ownerIdentifier,
          status,
          wkt,
        });

        parsedCount++;
      }

      console.log(`  Added ${parsedCount} valid parcels for ${reg.district}.`);
      await sleep(1500); // Politeness delay between regions
    } catch (err) {
      console.error(`  Error processing region ${reg.district}:`, err.message);
    }
  }

  console.log(`\n================================================================`);
  console.log(`Total real cadastral parcels assembled: ${recordsToInsert.length}`);
  console.log('================================================================\n');

  if (recordsToInsert.length === 0) {
    console.error('No records assembled. Exiting.');
    process.exit(1);
  }

  // Generate SQL insert file
  const sqlFile = path.join(DATA_DIR, 'seed_real_parcels.sql');
  console.log(`Writing SQL to: ${sqlFile}...`);

  const sqlLines = [];
  sqlLines.push('-- Bhoomi-Drishti Real Cadastral Data Seeding');
  sqlLines.push('-- Generated from OpenStreetMap real polygon geometries');
  sqlLines.push('BEGIN;\n');

  for (const rec of recordsToInsert) {
    sqlLines.push(`
      INSERT INTO land_records (
        id, parcel_number, survey_number, state, district, tehsil, village,
        land_area_sq_meters, land_use_type, ownership_type, owner_name,
        owner_identifier, status, boundary, created_at, updated_at
      ) VALUES (
        ${escapeSql(rec.id)}::uuid,
        ${escapeSql(rec.parcelNumber)},
        ${escapeSql(rec.surveyNumber)},
        ${escapeSql(rec.state)},
        ${escapeSql(rec.district)},
        ${escapeSql(rec.tehsil)},
        ${escapeSql(rec.village)},
        GREATEST(ROUND(CAST(ST_Area(ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_GeomFromText(${escapeSql(rec.wkt)}, 4326)), 3))::geography) AS numeric), 2), 50.00),
        ${escapeSql(rec.landUseType)},
        ${escapeSql(rec.ownershipType)},
        ${escapeSql(rec.ownerName)},
        ${escapeSql(rec.ownerIdentifier)},
        ${escapeSql(rec.status)},
        ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_GeomFromText(${escapeSql(rec.wkt)}, 4326)), 3)),
        NOW() - (interval '1 day' * floor(random() * 60)),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  sqlLines.push('\nCOMMIT;');
  fs.writeFileSync(sqlFile, sqlLines.join('\n'), 'utf8');
  console.log(`SQL file written successfully (${(fs.statSync(sqlFile).size / 1024).toFixed(1)} KB).`);

  // Execute SQL in Docker PostGIS container
  console.log('\nApplying SQL to PostGIS database in Docker container...');
  try {
    const { spawnSync } = await import('child_process');
    const sqlContent = fs.readFileSync(sqlFile);
    const result = spawnSync(
      'docker',
      ['exec', '-i', 'bhoomi-drishti-postgres', 'psql', '-U', 'bhoomi', '-d', 'bhoomi_drishti'],
      {
        input: sqlContent,
        stdio: ['pipe', 'inherit', 'inherit'],
        maxBuffer: 50 * 1024 * 1024,
      }
    );
    if (result.status !== 0) {
      throw new Error(`psql exited with status ${result.status}`);
    }
    console.log('\nDatabase seeding completed successfully!');
  } catch (err) {
    console.error('Failed to execute docker exec command:', err.message);
    console.log('\nYou can manually apply the SQL file with:');
    console.log(`docker exec -i bhoomi-drishti-postgres psql -U bhoomi -d bhoomi_drishti < "${sqlFile}"`);
    process.exit(1);
  }

  // Verification query
  console.log('\nVerifying seeded land records in PostGIS:');
  try {
    const verifyCmd = `docker exec bhoomi-drishti-postgres psql -U bhoomi -d bhoomi_drishti -c "
      SELECT state, district, count(*) as parcel_count,
             count(*) FILTER (WHERE land_use_type = 'AGRICULTURAL') as agri,
             count(*) FILTER (WHERE land_use_type = 'RESIDENTIAL') as res,
             count(*) FILTER (WHERE land_use_type = 'COMMERCIAL') as comm,
             count(*) FILTER (WHERE land_use_type = 'INDUSTRIAL') as ind,
             count(*) FILTER (WHERE land_use_type = 'GOVERNMENT') as govt,
             count(*) FILTER (WHERE land_use_type = 'FOREST') as forest
      FROM land_records
      GROUP BY state, district
      ORDER BY state, district;
    "`;
    execSync(verifyCmd, { stdio: 'inherit' });
  } catch (err) {
    console.warn('Verification query failed:', err.message);
  }

  console.log('\n================================================================');
  console.log('   All real land parcel data loaded and indexed in PostGIS!');
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Seeding process failed:', err);
  process.exit(1);
});
