export interface DonationCardData {
  donorName: string;
  amount: number;
  months: string;
  date: string;
  paymentMethod: string;
  totalDonated: number;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nameFontSize(name: string): number {
  if (name.length <= 14) return 36;
  if (name.length <= 20) return 28;
  if (name.length <= 26) return 22;
  return 18;
}

function amountFontSize(amt: string): number {
  if (amt.length <= 7) return 46;
  if (amt.length <= 10) return 38;
  return 30;
}

const BISMILLAH = 'بِسْمِ اللَهِ الرَّحْمٰنِ الرَّحِيمِ';
const JAZAKALLAH = 'جَزاكَ اللَّهُ خَيْرًا';

export function buildDonationCardSVG(data: DonationCardData): string {
  const nfs = nameFontSize(data.donorName);
  const amtStr = '$' + data.amount.toFixed(2);
  const afs = amountFontSize(amtStr);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700" viewBox="0 0 600 700" font-family="Arial, sans-serif">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0d3d1f"/>
      <stop offset="100%" stop-color="#092b15"/>
    </linearGradient>
    <linearGradient id="boxGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a5c32"/>
      <stop offset="100%" stop-color="#0f3d20"/>
    </linearGradient>
    <clipPath id="cardClip">
      <rect width="600" height="700" rx="28" ry="28"/>
    </clipPath>
  </defs>

  <rect width="600" height="700" rx="28" ry="28" fill="url(#bgGrad)"/>

  <g clip-path="url(#cardClip)">
    <ellipse cx="100" cy="648" rx="90" ry="108" fill="#0a3018" opacity="0.55"/>
    <rect x="55" y="560" width="90" height="200" rx="4" fill="#0a3018" opacity="0.45"/>
    <rect x="82" y="488" width="16" height="90" rx="3" fill="#0a3018" opacity="0.45"/>
    <ellipse cx="90" cy="488" rx="10" ry="13" fill="#0a3018" opacity="0.45"/>
    <ellipse cx="500" cy="660" rx="78" ry="100" fill="#0a3018" opacity="0.55"/>
    <rect x="460" y="582" width="80" height="160" rx="4" fill="#0a3018" opacity="0.45"/>
    <rect x="472" y="508" width="16" height="88" rx="3" fill="#0a3018" opacity="0.45"/>
    <ellipse cx="480" cy="508" rx="10" ry="13" fill="#0a3018" opacity="0.45"/>
  </g>

  <rect x="30" y="28" width="68" height="68" rx="14" fill="#1a5c32"/>
  <text x="64" y="72" text-anchor="middle" font-size="26" fill="#c8a84b" font-weight="bold" font-family="serif">&#x634;</text>
  <text x="114" y="54" font-size="21" font-weight="bold" fill="white">Ad-Dawah</text>
  <text x="114" y="76" font-size="12" fill="#a0c8a0">Islamic Education &amp; Outreach</text>
  <rect x="454" y="34" width="116" height="30" rx="15" fill="#1a5c32" stroke="#2d8a50" stroke-width="1.5"/>
  <text x="469" y="54" font-size="12" fill="#4cdb7a">&#10003; Verified</text>

  <text x="300" y="136" text-anchor="middle" font-size="27" fill="#c8a84b" font-family="serif">${BISMILLAH}</text>

  <line x1="60" y1="153" x2="256" y2="153" stroke="#c8a84b" stroke-width="1" opacity="0.5"/>
  <polygon points="300,145 306,153 300,161 294,153" fill="#c8a84b" opacity="0.7"/>
  <line x1="344" y1="153" x2="540" y2="153" stroke="#c8a84b" stroke-width="1" opacity="0.5"/>

  <text x="300" y="182" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="14" fill="#c8a84b">Thank you for your generous donation</text>

  <text x="300" y="238" text-anchor="middle" font-size="${nfs}" font-weight="bold" fill="white">${escapeXml(data.donorName)}</text>

  <rect x="30" y="256" width="540" height="96" rx="14" fill="url(#boxGrad)" stroke="#2a6e3a" stroke-width="1"/>
  <text x="58" y="280" font-size="9" fill="#8ab89a" letter-spacing="2">AMOUNT DONATED</text>
  <text x="58" y="334" font-size="${afs}" font-weight="bold" fill="white">${escapeXml(amtStr)}</text>
  <circle cx="528" cy="304" r="26" fill="#1f6b3a" stroke="#2d8a50" stroke-width="1.5"/>
  <text x="528" y="313" text-anchor="middle" font-size="17" font-weight="bold" fill="#4cdb7a">$</text>

  <rect x="30" y="366" width="540" height="68" rx="14" fill="url(#boxGrad)" stroke="#2a6e3a" stroke-width="1"/>
  <text x="58" y="389" font-size="9" fill="#8ab89a" letter-spacing="2">MONTH(S) COVERED</text>
  <text x="58" y="418" font-size="17" font-weight="bold" fill="white">${escapeXml(data.months)}</text>

  <rect x="30" y="448" width="170" height="78" rx="14" fill="url(#boxGrad)" stroke="#2a6e3a" stroke-width="1"/>
  <text x="50" y="470" font-size="8" fill="#8ab89a" letter-spacing="2">DATE</text>
  <text x="50" y="508" font-size="12" font-weight="bold" fill="white">${escapeXml(data.date)}</text>

  <rect x="212" y="448" width="180" height="78" rx="14" fill="url(#boxGrad)" stroke="#2a6e3a" stroke-width="1"/>
  <text x="232" y="470" font-size="8" fill="#8ab89a" letter-spacing="2">PAYMENT METHOD</text>
  <text x="232" y="508" font-size="12" font-weight="bold" fill="white">${escapeXml(data.paymentMethod)}</text>

  <rect x="404" y="448" width="166" height="78" rx="14" fill="url(#boxGrad)" stroke="#2a6e3a" stroke-width="1"/>
  <text x="424" y="470" font-size="8" fill="#8ab89a" letter-spacing="2">TOTAL DONATED</text>
  <text x="424" y="508" font-size="12" font-weight="bold" fill="white">$${escapeXml(data.totalDonated.toFixed(2))}</text>

  <text x="300" y="594" text-anchor="middle" font-size="23" fill="#c8a84b" font-family="serif">${JAZAKALLAH}</text>
  <text x="300" y="620" text-anchor="middle" font-size="12" fill="#8ab89a">May Allah reward you with goodness</text>
</svg>`;
}

export function svgDataUrl(svgString: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

export async function svgToJpegBlob(
  svgString: string,
  width = 600,
  height = 700,
): Promise<Blob | null> {
  return new Promise(resolve => {
    try {
      const url = svgDataUrl(svgString);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width * 2;
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.scale(2, 2);
        ctx.fillStyle = '#092b15';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(b => resolve(b), 'image/jpeg', 0.94);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}
