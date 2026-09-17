import { useState } from "react";
import { useJournalEntries } from "./useJournalEntries";
import JournalEntriesList from "./sections/JournalEntriesList";
import JournalEntryForm from "./components/JournalEntryForm";

function JournalEntries() {
  const [view, setView] = useState("list");
  const { entries, isLoading, error, createDraft, postEntry } = useJournalEntries();

  const handleCreateDraft = async (payload) => {
    await createDraft(payload);
    setView("list");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Journal Entries</h1>
        {view === "list" ? (
          <button type="button" onClick={() => setView("create")} style={{ padding: "8px 16px" }}>
            + New Entry
          </button>
        ) : (
          <button type="button" onClick={() => setView("list")} style={{ padding: "8px 16px" }}>
            ← Back to List
          </button>
        )}
      </div>

      {view === "list" ? (
        <JournalEntriesList entries={entries} isLoading={isLoading} error={error} onPost={postEntry} />
      ) : (
        <JournalEntryForm onSubmit={handleCreateDraft} onCancel={() => setView("list")} />
      )}
    </div>
  );
}

export default JournalEntries;
