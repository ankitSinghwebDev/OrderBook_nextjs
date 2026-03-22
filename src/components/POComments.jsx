'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Input, Typography, message } from 'antd';
import { SendOutlined, CommentOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';

const { Text } = Typography;

export default function POComments({ poId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await api.listPOComments(poId);
      setComments(res?.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (poId) fetchComments(); }, [poId]);

  const handleSend = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    try {
      await api.addPOComment(poId, newComment.trim());
      setNewComment('');
      fetchComments();
    } catch (err) { message.error(err?.message || 'Failed to add comment'); }
    finally { setSending(false); }
  };

  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <Card
      title={<span><CommentOutlined className="mr-2" />Comments ({comments.length})</span>}
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
        {comments.length === 0 && !loading && (
          <div className="text-center py-6" style={{ color: 'var(--muted)' }}>
            <CommentOutlined style={{ fontSize: 24 }} />
            <div className="mt-2 text-sm">No comments yet. Start the conversation.</div>
          </div>
        )}

        {comments.map((c) => {
          const isMe = c.userId === currentUserId;
          return (
            <div key={c._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                style={{
                  backgroundColor: isMe ? 'var(--accent-softer)' : 'var(--background)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: isMe ? 'var(--accent)' : 'var(--foreground)' }}>
                    {isMe ? 'You' : c.userName || 'User'}
                  </span>
                  {c.userRole && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ backgroundColor: 'var(--accent-softer)', color: 'var(--accent)' }}>
                      {c.userRole}
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{timeAgo(c.createdAt)}</span>
                </div>
                <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>{c.message}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Input.TextArea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows={2}
          onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <Button type="primary" icon={<SendOutlined />} loading={sending} onClick={handleSend} disabled={!newComment.trim()}>
          Send
        </Button>
      </div>
    </Card>
  );
}
