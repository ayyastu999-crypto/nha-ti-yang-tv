// "Rạp chiếu ảnh" home style: the album fills the screen, one photo at a time, slowly zooming (Ken Burns) and
// cross-fading to the next. Portrait photos are shown whole over a blurred copy of themselves (cinema.css).
const SECONDS_PER_PHOTO = 9;

let bg = null, slides = [], current = 0, index = -1, timer = null;
let source = () => [], onCaption = () => {}, isPlaying = () => true;

function makeSlide() {
  const slide = document.createElement('div');
  slide.className = 'cinema-slide';
  const fill = document.createElement('img');
  fill.className = 'cinema-fill';
  fill.alt = '';
  const photo = document.createElement('img');
  photo.className = 'cinema-photo';
  slide.append(fill, photo);
  return slide;
}

function show(next) {
  const photos = source();
  if (!photos.length) return;
  index = (next + photos.length) % photos.length;
  const item = photos[index];
  const slide = slides[1 - current], previous = slides[current];
  const [fill, photo] = slide.children;
  const reveal = () => {
    slide.classList.toggle('portrait', photo.naturalWidth / Math.max(1, photo.naturalHeight) < 1.25);
    photo.style.objectPosition = item.focus || '';
    // Restart the slow zoom on the incoming slide, then hand over with a cross-fade.
    slide.classList.remove('show');
    void slide.offsetWidth;
    slide.classList.add('show');
    previous.classList.remove('show');
    current = 1 - current;
    onCaption(item.caption || '');
  };
  fill.src = photo.src = item.src;
  photo.alt = item.alt || '';
  if (photo.complete && photo.naturalWidth) reveal();
  else photo.addEventListener('load', reveal, {once: true});
  // Warm the cache for the next photo so the next cross-fade does not wait on decoding.
  const upcoming = photos[(index + 1) % photos.length];
  if (upcoming) new Image().src = upcoming.src;
}

/**
 * Turn the full-screen slideshow on or off.
 * getPhotos returns the current album (it can change, e.g. when the family album arrives), setCaption shows the
 * photo's caption, playing() says whether the album is playing (the pause button).
 */
export function setCinema(on, getPhotos, setCaption, playing) {
  if (!on) {
    clearInterval(timer);
    timer = null;
    bg?.remove();
    bg = null;
    return;
  }
  source = getPhotos;
  onCaption = setCaption;
  isPlaying = playing;
  if (bg) return;
  bg = document.createElement('div');
  bg.className = 'cinema-bg';
  bg.setAttribute('aria-hidden', 'true');
  slides = [makeSlide(), makeSlide()];
  current = 0;
  bg.append(...slides);
  document.body.prepend(bg);
  show(index + 1);
  timer = setInterval(() => { if (isPlaying() && !document.hidden) show(index + 1); }, SECONDS_PER_PHOTO * 1000);
}
