const thStyle = {
  textAlign: "left",
  padding: "8px 12px",
  borderBottom: "2px solid #e5e7eb",
  fontSize: "13px",
  color: "#6b7280",
  textTransform: "uppercase",
};

const tdStyle = {
  padding: "8px 12px",
  borderBottom: "1px solid #f3f4f6",
};

function ReferenceDataTable({ columns, rows, onArchive, emptyLabel = "No records yet." }) {
  if (rows.length === 0) {
    return <p style={{ color: "#6b7280" }}>{emptyLabel}</p>;
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} style={thStyle}>
              {column.label}
            </th>
          ))}
          <th style={thStyle} />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.Id}>
            {columns.map((column) => (
              <td key={column.key} style={tdStyle}>
                {column.render ? column.render(row) : row[column.key]}
              </td>
            ))}
            <td style={{ ...tdStyle, textAlign: "right" }}>
              <button
                type="button"
                onClick={() => onArchive(row.Id)}
                style={{
                  padding: "4px 10px",
                  fontSize: "13px",
                  color: "#dc2626",
                  border: "1px solid #dc2626",
                  borderRadius: "4px",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Archive
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ReferenceDataTable;
