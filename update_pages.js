const fs = require('fs');
const path = require('path');

const results = JSON.parse(fs.readFileSync('extraction_results.json', 'utf8'));

const folderToHtmlMap = {
    'Web App Development': 'web-development.html',
    'Custom Development': 'custom-development.html',
    'Design': 'design-branding.html',
    'Digital Marketing': 'digital-marketing.html',
    'E-Commerce': 'e-commerce.html',
    'Mobile Development': 'mobile-development.html',
    'Quality Engineering Services': 'quality-engineering.html'
};

const titles = {
    'Web App Development': 'Web Development',
    'Custom Development': 'Custom Development',
    'Design': 'Design & Branding',
    'Digital Marketing': 'Digital Marketing',
    'E-Commerce': 'E-Commerce',
    'Mobile Development': 'Mobile Development',
    'Quality Engineering Services': 'Quality Engineering'
};

for (const [folder, htmlFile] of Object.entries(folderToHtmlMap)) {
    if (!results[folder]) {
        console.log(`No results for ${folder}`);
        continue;
    }

    const filePath = path.resolve(htmlFile);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Construct new inner content
    const newInnerContent = `
                    <h2>${titles[folder]}</h2>
                    ${results[folder]}
                    <a class="btn btn-primary" href="contact.html">Start a Project</a>
                `;

    // Regex to replace content inside col-lg-8
    // Matches <div class="col-lg-8"> content until the start of col-lg-4 div
    const regex = /(<div class="col-lg-8">)([\s\S]*?)(<\/div>\s*<div class="col-lg-4">)/;

    if (regex.test(content)) {
        content = content.replace(regex, `$1${newInnerContent}$3`);
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${htmlFile}`);
    } else {
        console.error(`Could not find target section in ${htmlFile}`);
    }
}
