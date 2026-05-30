const fs = require('fs');
const file = 'c:/Users/duran/Desktop/HSDsite/frontend/src/pages/LandingPage.jsx';
let code = fs.readFileSync(file, 'utf8');

// sections
code = code.replace(/py-12 md:py-20 lg:py-28/g, 'py-8 md:py-20 lg:py-28');
code = code.replace(/pt-20 pb-10 md:pt-24/g, 'pt-12 pb-6 md:pt-24');

// space-y gaps
code = code.replace(/gap-12 md:gap-16/g, 'gap-8 md:gap-16');
code = code.replace(/gap-8 md:gap-12/g, 'gap-6 md:gap-12');
code = code.replace(/mb-16 md:mb-20/g, 'mb-8 md:mb-20');
code = code.replace(/mb-8 md:mb-12/g, 'mb-6 md:mb-12');
code = code.replace(/mb-12 md:mb-0/g, 'mb-8 md:mb-0');
code = code.replace(/mt-12 md:mt-16/g, 'mt-8 md:mt-16');

// text sizes for titles and paragraphs
code = code.replace(/text-4xl md:text-5xl lg:text-7xl/g, 'text-3xl md:text-5xl lg:text-7xl');
code = code.replace(/text-3xl md:text-4xl/g, 'text-2xl md:text-4xl');
code = code.replace(/text-lg md:text-xl text-zinc-400/g, 'text-base md:text-xl text-zinc-400');
code = code.replace(/text-lg text-zinc-400/g, 'text-base md:text-lg text-zinc-400');
code = code.replace(/text-xl md:text-2xl font-semibold/g, 'text-lg md:text-2xl font-semibold');

// p-* paddings
code = code.replace(/p-6/g, 'p-4 md:p-6');
code = code.replace(/p-8/g, 'p-5 md:p-8');
code = code.replace(/p-10/g, 'p-6 md:p-10');
code = code.replace(/p-12/g, 'p-6 md:p-12');
code = code.replace(/md:md:p-6/g, 'md:p-6');
code = code.replace(/md:md:p-8/g, 'md:p-8');
code = code.replace(/md:md:p-10/g, 'md:p-10');
code = code.replace(/md:md:p-12/g, 'md:p-12');

// Mockup widths and heights scaling
code = code.replace(/w-\[300px\]/g, 'w-full md:w-[300px]');
code = code.replace(/w-\[270px\]/g, 'w-[90%] md:w-[270px]');
code = code.replace(/w-\[280px\]/g, 'w-[95%] md:w-[280px]');

// Fix duplicate classes created
fs.writeFileSync(file, code);
console.log('Mobile optimizations applied');

