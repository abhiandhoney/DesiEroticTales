import { useEffect, useState } from 'react';
import type { Collection } from '../types';
import { fetchWriterCollections, type CollectionFormValue } from '../lib/collections';

interface CollectionSelectorProps {
  userId: string;
  value: CollectionFormValue;
  onChange: (value: CollectionFormValue) => void;
  disabled?: boolean;
}

export default function CollectionSelector({
  userId,
  value,
  onChange,
  disabled = false,
}: CollectionSelectorProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWriterCollections(userId)
      .then(setCollections)
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const enabled = value.mode !== 'none';

  return (
    <div className="collection-selector">
      <label className="collection-selector__toggle">
        <input
          type="checkbox"
          checked={enabled}
          disabled={disabled}
          onChange={(e) => {
            if (!e.target.checked) {
              onChange({ mode: 'none' });
              return;
            }
            if (collections.length > 0) {
              onChange({ mode: 'existing', collectionId: collections[0].id, partNumber: 1 });
            } else {
              onChange({ mode: 'new', title: '', partNumber: 1 });
            }
          }}
        />
        <span>Part of a collection / series</span>
      </label>

      {enabled && (
        <div className="collection-selector__fields">
          <div className="form-group">
            <label htmlFor="collection-mode">Collection</label>
            <select
              id="collection-mode"
              className="select"
              disabled={disabled || loading}
              value={value.mode === 'new' ? '__new__' : value.mode === 'existing' ? value.collectionId : ''}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '__new__') {
                  onChange({ mode: 'new', title: '', partNumber: getPartNumber(value) });
                } else {
                  onChange({ mode: 'existing', collectionId: v, partNumber: getPartNumber(value) });
                }
              }}
            >
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
              <option value="__new__">+ Create new collection</option>
            </select>
          </div>

          {value.mode === 'new' && (
            <div className="form-group">
              <label htmlFor="collection-title">New collection title</label>
              <input
                id="collection-title"
                type="text"
                className="input"
                disabled={disabled}
                value={value.title}
                onChange={(e) => onChange({ ...value, title: e.target.value })}
                placeholder="e.g. Summer Nights — Parts 1–5"
                maxLength={120}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="collection-part">Part number</label>
            <input
              id="collection-part"
              type="number"
              className="input"
              min={1}
              max={99}
              disabled={disabled}
              value={getPartNumber(value)}
              onChange={(e) => {
                const partNumber = Math.max(1, Number(e.target.value) || 1);
                if (value.mode === 'existing') onChange({ ...value, partNumber });
                else if (value.mode === 'new') onChange({ ...value, partNumber });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function getPartNumber(value: CollectionFormValue): number {
  if (value.mode === 'existing' || value.mode === 'new') return value.partNumber;
  return 1;
}