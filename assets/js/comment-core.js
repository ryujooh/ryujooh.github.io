// Comment System - Requires Supabase or similar backend
// To the USER: You need to set up a Supabase table named 'comments' with:
// id (uuid), created_at (timestamptz), post_id (text), author (text), content (text), password (text)

const SUPABASE_URL = ''; // YOUR SUPABASE URL
const SUPABASE_KEY = ''; // YOUR SUPABASE ANON KEY

document.addEventListener('DOMContentLoaded', () => {
    loadComments();
});

async function loadComments() {
    const list = document.getElementById('comment-list');
    const postId = window.location.pathname;

    if (!SUPABASE_URL) {
        list.innerHTML = '<p style="color: #888; font-size: 0.8rem;">Comment system pending setup (Supabase URL missing).</p>';
        return;
    }

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/comments?post_id=eq.${postId}&select=*`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const data = await res.json();

        if (data.length === 0) {
            list.innerHTML = '<p style="color: #ccc;">NO COMMENTS YET.</p>';
            return;
        }

        list.innerHTML = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(c => `
            <div class="comment-item">
                <div class="cmt-meta">
                    <span>${c.author} / ${new Date(c.created_at).toLocaleDateString()}</span>
                    <span class="cmt-del" onclick="deleteComment('${c.id}', '${c.password}')">DELETE</span>
                </div>
                <div class="cmt-text">${c.content}</div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Failed to load comments', e);
    }
}

async function submitComment() {
    const author = document.getElementById('cmt-author').value;
    const pass = document.getElementById('cmt-pass').value;
    const content = document.getElementById('cmt-content').value;
    const postId = window.location.pathname;

    if (!author || !pass || !content) return alert('FILL ALL FIELDS');

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ post_id: postId, author, content, password: pass })
        });

        if (res.ok) {
            alert('COMMENT POSTED');
            document.getElementById('cmt-author').value = '';
            document.getElementById('cmt-pass').value = '';
            document.getElementById('cmt-content').value = '';
            loadComments();
        }
    } catch (e) {
        alert('FAILED TO POST COMMENT');
    }
}

async function deleteComment(id, correctPass) {
    const pass = prompt('ENTER 4-DIGIT PASSWORD TO DELETE:');
    if (pass === correctPass) {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/comments?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            if (res.ok) {
                alert('COMMENT DELETED');
                loadComments();
            }
        } catch (e) { alert('DELETE FAILED'); }
    } else {
        alert('WRONG PASSWORD');
    }
}
