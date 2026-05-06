"use client";

import { useState, useCallback } from "react";
import { Contact, ContactUserType } from "@/types/contact";

interface RecipientPickerProps {
  recipientsText: string;
  onChange: (value: string) => void;
}

const USER_TYPE_LABELS: Record<ContactUserType, string> = {
  "ud-grad-student": "UD Grad Student",
  "undergraduate-student": "Undergraduate",
  "industry-academic-friend": "Industry / Academic",
  "other-university-student": "Other University",
};

export default function RecipientPicker({
  recipientsText,
  onChange,
}: RecipientPickerProps) {
  const [showContacts, setShowContacts] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [selected, setSelected] = useState<Map<string, Contact>>(new Map());

  const recipientCount = recipientsText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean).length;

  const fetchContacts = useCallback(
    async (p = 1, s = search, ut = filterType) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: "20",
          status: "subscribed",
          sort_by: "full_name",
          sort_order: "asc",
        });
        if (s) params.set("search", s);
        if (ut) params.set("user_type", ut);

        const res = await fetch(`/api/contacts?${params}`);
        const data = await res.json();
        if (!data.success) throw new Error("Failed to load contacts");

        setContacts(data.contacts);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setPage(p);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load contacts");
      } finally {
        setLoading(false);
      }
    },
    [search, filterType]
  );

  const handleOpenContacts = () => {
    setShowContacts(true);
    fetchContacts(1);
  };

  const handleSearch = () => {
    fetchContacts(1, search, filterType);
  };

  const toggleContact = (contact: Contact) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(contact.id)) {
        next.delete(contact.id);
      } else {
        next.set(contact.id, contact);
      }
      return next;
    });
  };

  const selectAllOnPage = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      for (const c of contacts) {
        next.set(c.id, c);
      }
      return next;
    });
  };

  const deselectAllOnPage = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      for (const c of contacts) {
        next.delete(c.id);
      }
      return next;
    });
  };

  const addAllSubscribers = async () => {
    setLoading(true);
    setError(null);
    try {
      let allContacts: Contact[] = [];
      let p = 1;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          page: String(p),
          limit: "100",
          status: "subscribed",
          sort_by: "email",
          sort_order: "asc",
        });
        const res = await fetch(`/api/contacts?${params}`);
        const data = await res.json();
        if (!data.success) throw new Error("Failed to load contacts");

        allContacts = allContacts.concat(data.contacts);
        hasMore = p < data.totalPages;
        p++;
      }

      setSelected(() => {
        const next = new Map<string, Contact>();
        for (const c of allContacts) {
          next.set(c.id, c);
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load all contacts");
    } finally {
      setLoading(false);
    }
  };

  const addSelectedToRecipients = () => {
    if (selected.size === 0) return;

    const existingEmails = new Set(
      recipientsText
        .split("\n")
        .map((line) => {
          const match = line.trim().match(/<(.+@.+)>$/);
          return match ? match[1].toLowerCase() : line.trim().toLowerCase();
        })
        .filter(Boolean)
    );

    const newLines: string[] = [];
    for (const contact of selected.values()) {
      if (existingEmails.has(contact.email.toLowerCase())) continue;
      if (contact.full_name) {
        newLines.push(`${contact.full_name} <${contact.email}>`);
      } else {
        newLines.push(contact.email);
      }
    }

    if (newLines.length === 0) return;

    const existing = recipientsText.trim();
    const updated = existing ? `${existing}\n${newLines.join("\n")}` : newLines.join("\n");
    onChange(updated);
    setSelected(new Map());
  };

  const allPageSelected = contacts.length > 0 && contacts.every((c) => selected.has(c.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">4. Recipients</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div>
        <label htmlFor="recipients" className="block text-sm text-gray-600 mb-1">
          One email per line. Optionally use{" "}
          <code className="bg-gray-100 px-1 rounded text-xs">
            Name &lt;email@example.com&gt;
          </code>{" "}
          format for personalised greetings.
        </label>
        <textarea
          id="recipients"
          rows={4}
          value={recipientsText}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-primary focus:border-blue-primary font-mono text-sm"
        />
      </div>

      {!showContacts ? (
        <button
          type="button"
          onClick={handleOpenContacts}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-primary border border-blue-primary rounded-md hover:bg-blue-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Load from Contacts
        </button>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Search & Filter Bar */}
          <div className="bg-gray-50 p-3 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search by name or email..."
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-primary focus:border-blue-primary"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  fetchContacts(1, search, e.target.value);
                }}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-primary focus:border-blue-primary"
              >
                <option value="">All types</option>
                {Object.entries(USER_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSearch}
                className="px-4 py-1.5 text-sm font-medium bg-blue-primary text-white rounded-md hover:bg-blue-800 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Selected chips */}
          {selected.size > 0 && (
            <div className="bg-blue-50 px-3 py-2 border-b border-gray-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-blue-800">
                  {selected.size} contact{selected.size !== 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(new Map())}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    onClick={addSelectedToRecipients}
                    className="text-xs font-medium px-2.5 py-1 bg-blue-primary text-white rounded hover:bg-blue-800 transition-colors"
                  >
                    Add to Recipients
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {Array.from(selected.values()).map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-blue-200 rounded-full text-xs text-gray-700"
                  >
                    {c.full_name || c.email}
                    <button
                      type="button"
                      onClick={() => toggleContact(c)}
                      className="text-gray-400 hover:text-red-500 leading-none"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bulk actions */}
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex flex-wrap items-center gap-3 text-xs">
            <button
              type="button"
              onClick={allPageSelected ? deselectAllOnPage : selectAllOnPage}
              className="text-blue-primary hover:underline font-medium"
            >
              {allPageSelected ? "Deselect page" : "Select page"}
            </button>
            <button
              type="button"
              onClick={addAllSubscribers}
              disabled={loading}
              className="text-blue-primary hover:underline font-medium disabled:opacity-50"
            >
              Select all subscribers ({total})
            </button>
            <span className="text-gray-400 ml-auto">
              {total} total contact{total !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 bg-red-50 text-red-700 text-sm border-b border-gray-200">
              {error}
            </div>
          )}

          {/* Contact list */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-primary" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No contacts found.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                    <th className="pl-3 pr-1 py-2 w-8"></th>
                    <th className="px-2 py-2">Name / Email</th>
                    <th className="px-2 py-2 hidden sm:table-cell">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contacts.map((c) => {
                    const isSelected = selected.has(c.id);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => toggleContact(c)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50 hover:bg-blue-100"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="pl-3 pr-1 py-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleContact(c)}
                            className="rounded border-gray-300 text-blue-primary focus:ring-blue-primary"
                          />
                        </td>
                        <td className="px-2 py-2">
                          {c.full_name && (
                            <div className="font-medium text-gray-900">
                              {c.full_name}
                            </div>
                          )}
                          <div className="text-gray-500 font-mono text-xs">
                            {c.email}
                          </div>
                        </td>
                        <td className="px-2 py-2 hidden sm:table-cell text-xs text-gray-500">
                          {c.user_type
                            ? USER_TYPE_LABELS[c.user_type] || c.user_type
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-3 py-2 border-t border-gray-200 flex items-center justify-between text-xs">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => fetchContacts(page - 1, search, filterType)}
                className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => fetchContacts(page + 1, search, filterType)}
                className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {/* Close panel */}
          <div className="bg-gray-50 px-3 py-2 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={() => setShowContacts(false)}
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              Close contact picker
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
