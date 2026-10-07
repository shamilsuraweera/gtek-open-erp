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
      <div className="toolbar">
        {view === "list" ? (
          <button type="button" className="btn-primary" onClick={() => setView("create")}>
            + New Entry
          </button>
        ) : (
          <button type="button" onClick={() => setView("list")}>
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
