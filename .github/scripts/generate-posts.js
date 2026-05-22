const fs = require('fs');
const path = require('path');

const postsDir = 'pages';
const outputFile = 'posts.json';

if (!fs.existsSync(postsDir)) {
  fs.writeFileSync(outputFile, JSON.stringify([], null, 2));
  process.exit(0);
}

const files = fs
  .readdirSync(postsDir)
  .filter((file) => file.endsWith('.md'))
  .sort((a, b) => b.localeCompare(a));

const posts = files.map((filename) => {
  const filePath = path.join(postsDir, filename);
  const content = fs.readFileSync(filePath, 'utf8');

  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  let metadata = {};
  let postContent = content;

  if (frontMatterMatch) {
    const frontMatter = frontMatterMatch[1];
    postContent = frontMatterMatch[2];
    frontMatter.split('\n').forEach((line) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim().replace(/^['"]|['"]$/g, '');
        if (key === 'tags' && value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(t => t.trim().replace(/^['"]|['"]$/g, ''));
        }
        metadata[key] = value;
      }
    });
  }

  const excerpt = postContent
    .replace(/#.*$/gm, '').replace(/```[\s\S]*?```/g, '').replace(/\n+/g, ' ')
    .trim().substring(0, 200).trim();

  return {
    file: filename,
    title: metadata.title || filename.replace('.md', ''),
    date: metadata.date || new Date().toISOString().split('T')[0],
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    category: metadata.category || '',
    excerpt: excerpt + (excerpt.length === 200 ? '...' : ''),
  };
});

// Add HTML files from docs folder
const docsDir = 'docs';
if (fs.existsSync(docsDir)) {
  const docFiles = fs.readdirSync(docsDir).filter((file) => file.endsWith('.html'));
  docFiles.forEach((filename) => {
    const filePath = path.join(docsDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract date from filename if possible
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

    // Extract title from <title> tag or <h1> tag
    const titleMatch = content.match(/<title>(.*?)<\/title>/) || content.match(/<h1[^>]*>(.*?)<\/h1>/);
    let title = titleMatch ? titleMatch[1].replace(' — Research Note', '') : filename.replace('.html', '');

    // Extract excerpt from the first <p> or .standfirst element
    let excerpt = '';
    const standfirstMatch = content.match(/class="standfirst"[^>]*>([\s\S]*?)<\/p>/) || content.match(/<p>([\s\S]*?)<\/p>/);
    if (standfirstMatch) {
      excerpt = standfirstMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 200);
      if (excerpt.length === 200) excerpt += '...';
    }

    posts.push({
      file: `docs/${filename}`,
      title: title.trim(),
      date: date,
      tags: ['Research Note'],
      category: 'Research',
      excerpt: excerpt
    });
  });
}

posts.sort((a, b) => new Date(b.date) - new Date(a.date));
fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2));
console.log(`Generated posts.json with ${posts.length} posts`);
