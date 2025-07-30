import { useState } from 'react'
import Parser from 'rss-parser'
import './App.css'

const parser = new Parser()

function App() {
  const [search, setSearch] = useState('');
  const [followedUsers, setFollowedUsers] = useState([]); // [{ username, avatar, latestActivity }]
  const [activities, setActivities] = useState([]); // [{ username, repo, message, link, time }]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper to fetch and parse Atom feed
  const fetchUserFeed = async (username) => {
    setLoading(true);
    setError('');
    try {
      const feedUrl = `https://github.com/${username}.atom`;
      const feed = await parser.parseURL(feedUrl);
      // Extract push/commit activities
      const pushActivities = feed.items
        .filter(item => item.title && item.title.includes('pushed to'))
        .map(item => {
          // Example title: "username pushed to branch at repo"
          // Example content: commit message(s) in HTML
          const repoMatch = item.title.match(/at ([^ ]+\/[\w-]+)/);
          const repo = repoMatch ? repoMatch[1] : '';
          const commitMsg = item.contentSnippet || '';
          return {
            username,
            repo,
            message: commitMsg,
            link: item.link,
            time: item.isoDate,
          };
        });
      // Add user card if not already followed
      setFollowedUsers(prev => {
        if (prev.some(u => u.username === username)) return prev;
        return [
          ...prev,
          {
            username,
            avatar: `https://github.com/${username}.png`,
            latestActivity: pushActivities[0]?.message || 'No recent activity',
          },
        ];
      });
      // Add activities to feed
      setActivities(prev => [
        ...pushActivities,
        ...prev.filter(a => a.username !== username),
      ]);
    } catch (err) {
      setError('Could not fetch activity for this user.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = () => {
    const username = search.trim();
    if (!username) return;
    fetchUserFeed(username);
    setSearch('');
  };

  return (
    <div className="devwatch-root">
      <header className="devwatch-header">
        <h1 className="devwatch-title">DevWatch</h1>
        <div className="devwatch-search-bar">
          <input
            type="text"
            placeholder="Enter GitHub username (e.g. torvalds)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="devwatch-search-input"
            aria-label="GitHub username"
            onKeyDown={e => e.key === 'Enter' && handleFollow()}
          />
          <button className="devwatch-search-btn" onClick={handleFollow} disabled={loading}>
            {loading ? 'Loading...' : 'Follow'}
          </button>
        </div>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </header>
      <main className="devwatch-main">
        <aside className="devwatch-users-list">
          {followedUsers.length === 0 ? (
            <div className="devwatch-user-card-placeholder">No users followed yet.</div>
          ) : (
            followedUsers.map(user => (
              <div className="devwatch-user-card" key={user.username}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={user.avatar} alt={user.username} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{user.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-muted-light)' }}>
                      {user.latestActivity}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </aside>
        <section className="devwatch-activity-feed">
          {activities.length === 0 ? (
            <div className="devwatch-activity-placeholder">No activity to display.</div>
          ) : (
            activities.map((a, i) => (
              <div className="devwatch-activity-item" key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span role="img" aria-label="push">⬆️</span>
                  <a href={a.link} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--color-accent)' }}>
                    {a.repo}
                  </a>
                  <span style={{ fontSize: 12, color: 'var(--color-muted-light)', marginLeft: 'auto' }}>
                    <span role="img" aria-label="time">🕒</span> {a.time ? new Date(a.time).toLocaleString() : ''}
                  </span>
                </div>
                <div style={{ fontFamily: 'inherit', marginTop: 4 }}>{a.message}</div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  )
}

export default App
