// "Tết sum vầy" home style: the season check, the tear-off calendar text and the falling mai blossoms.
// Dates follow the Vietnamese lunar calendar (UTC+7) from lunar.mjs.
import {solarToLunar, lunarYearName} from './lunar.mjs';

const WISHES = ['An khang thịnh vượng', 'Vạn sự như ý', 'Sức khỏe dồi dào', 'Gia đình hạnh phúc', 'Tấn tài tấn lộc',
  'Bình an may mắn', 'Cả nhà sum vầy', 'Năm mới phát tài', 'Trên thuận dưới hòa', 'Con ngoan mau lớn',
  'Hạnh phúc đong đầy', 'Tiền vào như nước'];

/** Tết season for the "automatic" style: 23 of the last lunar month (ông Công ông Táo) to the 10th of Giêng. */
export function isTetSeason(lunar) {
  return (lunar.month === 12 && lunar.day >= 23) || (lunar.month === 1 && !lunar.leap && lunar.day <= 10);
}

/** Days from the given solar date to the next mùng 1 Tết, and that lunar year. At most ~385 steps. */
function nextTet(day, month, year) {
  const start = Date.UTC(year, month - 1, day);
  for (let n = 1; n <= 400; n++) {
    const d = new Date(start + n * 86400000);
    const lunar = solarToLunar(d.getUTCDate(), d.getUTCMonth() + 1, d.getUTCFullYear());
    if (lunar.day === 1 && lunar.month === 1 && !lunar.leap) return {days: n, year: lunar.year};
  }
  return null;
}

/** The line under the calendar: which day of Tết it is, or how long until the next one. */
export function tetCountdown(today, lunar) {
  if (lunar.month === 1 && !lunar.leap && lunar.day <= 10) {
    return lunar.day <= 3 ? `Mùng ${lunar.day} Tết ${lunarYearName(lunar.year)}` : `Mùng ${lunar.day} tháng Giêng`;
  }
  const next = nextTet(today.day, today.month, today.year);
  return next ? `Còn ${next.days} ngày nữa là Tết ${lunarYearName(next.year)}` : '';
}

/** One wish per day, the same all day long. */
export function tetWish(today) {
  return WISHES[(today.year * 372 + today.month * 31 + today.day) % WISHES.length];
}

// Five round yellow petals around an orange heart: a hoa mai, drawn inline so it needs no image file.
const MAI = '<svg viewBox="0 0 40 40" aria-hidden="true">' +
  [0, 72, 144, 216, 288].map(a => `<circle cx="${20 + 9 * Math.sin(a * Math.PI / 180)}" cy="${20 - 9 * Math.cos(a * Math.PI / 180)}" r="8" fill="#f7c736"/>`).join('') +
  '<circle cx="20" cy="20" r="4.5" fill="#e8801f"/></svg>';

let petals = null;

/** Show or remove the falling blossoms (none with reduced motion: the CSS hides them). */
export function setTetBlossoms(on) {
  if (!on) { petals?.remove(); petals = null; return; }
  if (petals) return;
  petals = document.createElement('div');
  petals.className = 'tet-petals';
  petals.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 12; i++) {
    const petal = document.createElement('span');
    petal.innerHTML = MAI;
    petal.style.left = `${(i * 8.3 + (i % 3) * 3) % 100}%`;
    petal.style.setProperty('--size', `${14 + (i * 7) % 14}px`);
    petal.style.animationDuration = `${11 + (i * 5) % 9}s`;
    petal.style.animationDelay = `${-((i * 3.7) % 15)}s`;
    petals.append(petal);
  }
  document.body.append(petals);
}
