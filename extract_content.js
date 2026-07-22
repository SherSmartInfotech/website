const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const servicesDir = path.resolve('Contents/Services');
const tempDir = path.resolve('temp_extraction');

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

// Map folder names to HTML files
const folderToHtmlMap = {
    'Web App Development': 'web-development.html',
    'Custom Development': 'custom-development.html',
    'Design': 'design-branding.html',
    'Digital Marketing': 'digital-marketing.html',
    'E-Commerce': 'e-commerce.html',
    'Mobile Development': 'mobile-development.html',
    'Quality Engineering Services': 'quality-engineering.html'
};

function extractDocxText(filePath) {
    const fileName = path.basename(filePath, '.docx');
    const fileBaseName = path.basename(filePath);
    const zipPath = path.join(tempDir, fileName + '.zip');
    const fileTempDir = path.join(tempDir, fileName);

    // Clean up previous temp dir for this file if it exists
    if (fs.existsSync(fileTempDir)) {
        fs.rmSync(fileTempDir, { recursive: true, force: true });
    }

    // Copy docx to zip
    try {
        fs.copyFileSync(filePath, zipPath);
    } catch (e) {
        console.error(`Failed to copy ${filePath} to ${zipPath}: ${e.message}`);
        return null;
    }

    // Unzip using PowerShell
    try {
        execSync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${fileTempDir}' -Force"`);
    } catch (e) {
        console.error(`Failed to unzip ${zipPath}: ${e.message}`);
        // Clean up zip
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        return null;
    }

    // Clean up zip
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

    const xmlPath = path.join(fileTempDir, 'word', 'document.xml');
    if (!fs.existsSync(xmlPath)) {
        return null;
    }

    const xmlContent = fs.readFileSync(xmlPath, 'utf8');

    // Simple regex parsing for paragraphs and text
    // Remove all tags except w:p
    // This is a naive parser but sufficient for plain text extraction

    let html = `<h3>${fileName.replace(/_/g, ' ').replace('SS Services ', '')}</h3>`;

    // Split by paragraph
    const paragraphs = xmlContent.match(/<w:p[\s\S]*?<\/w:p>/g) || [];

    paragraphs.forEach(p => {
        // Extract text runs
        const texts = p.match(/<w:t[\s\S]*?>([\s\S]*?)<\/w:t>/g) || [];
        let pText = '';
        texts.forEach(t => {
            const match = /<w:t[\s\S]*?>([\s\S]*?)<\/w:t>/.exec(t);
            if (match) {
                pText += match[1];
            }
        });

        if (pText.trim()) {
            html += `<p>${pText}</p>`;
        }
    });

    return html;
}

function processDirectory() {
    const results = {};

    // Get all subdirectories in Services
    const dirs = fs.readdirSync(servicesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    dirs.forEach(dirName => {
        const dirPath = path.join(servicesDir, dirName);
        const files = fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.docx'));

        let dirHtml = '';

        files.forEach(file => {
            console.log(`Processing ${path.join(dirName, file)}...`);
            const text = extractDocxText(path.join(dirPath, file));
            if (text) {
                dirHtml += text + '\n';
            }
        });

        if (dirHtml) {
            results[dirName] = dirHtml;
        }
    });

    fs.writeFileSync('extraction_results.json', JSON.stringify(results, null, 2));
    console.log('Extraction complete. Results saved to extraction_results.json');
}

processDirectory();
