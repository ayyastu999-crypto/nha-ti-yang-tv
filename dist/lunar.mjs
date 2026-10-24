/** Vietnamese lunar conversion, adapted mathematically from Ho Ngoc Duc.
 * Reference: https://xemamlich.uhm.vn/calrules.html
 * Astronomical approximation; modern Vietnamese civil time is UTC+7.
 * Keep calendar conversion separate from the browser's local timezone.
 */
const floor = Math.floor;
const rad = Math.PI / 180;
const synodic = 29.530588853;

export function julianDay(day, month, year) {
  const a = floor((14 - month) / 12), y = year + 4800 - a, m = month + 12 * a - 3;
  const base = day + floor((153 * m + 2) / 5) + 365 * y + floor(y / 4);
  const gregorian = base - floor(y / 100) + floor(y / 400) - 32045;
  return gregorian < 2299161 ? base - 32083 : gregorian;
}

function newMoonDay(k, zone) {
  const t = k / 1236.85, t2 = t * t, t3 = t2 * t;
  let jd = 2415020.75933 + 29.53058868 * k + .0001178 * t2 - .000000155 * t3;
  jd += .00033 * Math.sin((166.56 + 132.87 * t - .009173 * t2) * rad);
  const sun = (359.2242 + 29.10535608 * k - .0000333 * t2 - .00000347 * t3) * rad;
  const moon = (306.0253 + 385.81691806 * k + .0107306 * t2 + .00001236 * t3) * rad;
  const lat = (21.2964 + 390.67050646 * k - .0016528 * t2 - .00000239 * t3) * rad;
  const c = (.1734 - .000393 * t) * Math.sin(sun) + .0021 * Math.sin(2 * sun)
    - .4068 * Math.sin(moon) + .0161 * Math.sin(2 * moon) - .0004 * Math.sin(3 * moon)
    + .0104 * Math.sin(2 * lat) - .0051 * Math.sin(sun + moon) - .0074 * Math.sin(sun - moon)
    + .0004 * Math.sin(2 * lat + sun) - .0004 * Math.sin(2 * lat - sun)
    - .0006 * Math.sin(2 * lat + moon) + .001 * Math.sin(2 * lat - moon)
    + .0005 * Math.sin(2 * moon + sun);
  const delta = t < -11
    ? .001 + .000839 * t + .0002261 * t2 - .00000845 * t3 - .000000081 * t * t3
    : -.000278 + .000265 * t + .000262 * t2;
  return floor(jd + c - delta + .5 + zone / 24);
}

function sunSector(jd, zone) {
  const t = (jd - 2451545.5 - zone / 24) / 36525, t2 = t * t;
  const mean = (357.5291 + 35999.0503 * t - .0001559 * t2 - .00000048 * t * t2) * rad;
  let lon = (280.46645 + 36000.76983 * t + .0003032 * t2
    + (1.9146 - .004817 * t - .000014 * t2) * Math.sin(mean)
    + (.019993 - .000101 * t) * Math.sin(2 * mean) + .00029 * Math.sin(3 * mean)) * rad;
  lon -= Math.PI * 2 * floor(lon / (Math.PI * 2));
  return floor(lon / Math.PI * 6);
}

function monthEleven(year, zone) {
  const k = floor((julianDay(31, 12, year) - 2415021) / synodic);
  const moon = newMoonDay(k, zone);
  return sunSector(moon, zone) >= 9 ? newMoonDay(k - 1, zone) : moon;
}

function leapOffset(start, zone) {
  const k = floor((start - 2415021.076998695) / synodic + .5);
  let offset = 1, previous, sector = sunSector(newMoonDay(k + offset, zone), zone);
  do {
    previous = sector;
    sector = sunSector(newMoonDay(k + ++offset, zone), zone);
  } while (sector !== previous && offset < 14);
  return offset - 1;
}

export function solarToLunar(day, month, year, zone = 7) {
  const jd = julianDay(day, month, year), k = floor((jd - 2415021.076998695) / synodic);
  let start = newMoonDay(k + 1, zone);
  if (start > jd) start = newMoonDay(k, zone);
  let a = monthEleven(year, zone), b = a, lunarYear;
  if (a >= start) { lunarYear = year; a = monthEleven(year - 1, zone); }
  else { lunarYear = year + 1; b = monthEleven(year + 1, zone); }
  const offset = floor((start - a) / 29);
  let lunarMonth = offset + 11, leap = false;
  if (b - a > 365) {
    const leapAt = leapOffset(a, zone);
    if (offset >= leapAt) { lunarMonth = offset + 10; leap = offset === leapAt; }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && offset < 4) lunarYear--;
  return { day: jd - start + 1, month: lunarMonth, year: lunarYear, leap };
}

export function vietnamDateParts(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', day: 'numeric', month: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(now).filter(x => x.type !== 'literal').map(x => [x.type, Number(x.value)]));
  return p;
}

export function lunarYearName(year) {
  const stems = ['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
  const branches = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
  return stems[(year + 6) % 10] + ' ' + branches[(year + 8) % 12];
}
