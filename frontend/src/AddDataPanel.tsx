import { useState } from 'react';
import type { CreateArtistRequest, CreateDiscoveryEdgeRequest } from './types';

interface AddDataPanelProps {
  onDataAdded: () => void;
}

function AddDataPanel({ onDataAdded }: AddDataPanelProps) {
  const [mode, setMode] = useState<'artist' | 'edge'>('artist');
  const [isOpen, setIsOpen] = useState(false);

  const [artistName, setArtistName] = useState('');
  const [artistImageUrl, setArtistImageUrl] = useState('');

  const [fromArtistName, setFromArtistName] = useState('');
  const [toArtistName, setToArtistName] = useState('');
  const [connectorName, setConnectorName] = useState('');
  const [edgeType, setEdgeType] = useState('');
  const [notes, setNotes] = useState('');

  async function handleArtistSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: CreateArtistRequest = {
      name: artistName,
      imageUrl: artistImageUrl || null,
    };
    await fetch('http://localhost:8080/api/artists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setArtistName('');
    setArtistImageUrl('');
    onDataAdded();
  }

  async function handleEdgeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: CreateDiscoveryEdgeRequest = {
      fromArtistName: fromArtistName || null,
      toArtistName,
      connectorName: connectorName || null,
      edgeType: edgeType || null,
      notes: notes || null,
    };
    await fetch('http://localhost:8080/api/discovery-edges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setFromArtistName('');
    setToArtistName('');
    setConnectorName('');
    setEdgeType('');
    setNotes('');
    onDataAdded();
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg"
      >
        + Add Data
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-neutral-900 text-white p-4 rounded-lg shadow-lg w-80">
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('artist')}
            className={`px-3 py-1 rounded ${mode === 'artist' ? 'bg-blue-500' : 'bg-neutral-700'}`}
          >
            Artist
          </button>
          <button
            onClick={() => setMode('edge')}
            className={`px-3 py-1 rounded ${mode === 'edge' ? 'bg-blue-500' : 'bg-neutral-700'}`}
          >
            Connection
          </button>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-neutral-400">✕</button>
      </div>

      {mode === 'artist' ? (
        <form onSubmit={handleArtistSubmit} className="flex flex-col gap-2">
          <input
            className="bg-neutral-800 rounded px-2 py-1"
            placeholder="Artist name"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            required
          />
          <input
            className="bg-neutral-800 rounded px-2 py-1"
            placeholder="Image URL (optional)"
            value={artistImageUrl}
            onChange={(e) => setArtistImageUrl(e.target.value)}
          />
          <button type="submit" className="bg-blue-500 rounded px-2 py-1 mt-1">
            Add Artist
          </button>
        </form>
      ) : (
        <form onSubmit={handleEdgeSubmit} className="flex flex-col gap-2">
          <input
            className="bg-neutral-800 rounded px-2 py-1"
            placeholder="From artist (optional)"
            value={fromArtistName}
            onChange={(e) => setFromArtistName(e.target.value)}
          />
          <input
            className="bg-neutral-800 rounded px-2 py-1"
            placeholder="To artist"
            value={toArtistName}
            onChange={(e) => setToArtistName(e.target.value)}
            required
          />
          <input
            className="bg-neutral-800 rounded px-2 py-1"
            placeholder="Connector (who/what)"
            value={connectorName}
            onChange={(e) => setConnectorName(e.target.value)}
          />
          <input
            className="bg-neutral-800 rounded px-2 py-1"
            placeholder="Edge type"
            value={edgeType}
            onChange={(e) => setEdgeType(e.target.value)}
          />
          <textarea
            className="bg-neutral-800 rounded px-2 py-1"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button type="submit" className="bg-blue-500 rounded px-2 py-1 mt-1">
            Add Connection
          </button>
        </form>
      )}
    </div>
  );
}

export default AddDataPanel;