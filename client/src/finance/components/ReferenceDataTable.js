

function ReferenceDataTable({ columns, rows, onArchive, emptyLabel = "No records yet." }) {
  if (rows.length === 0) {
    return <p className="msg msg-muted">{emptyLabel}</p>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key}>
              {column.label}
            </th>
          ))}
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.Id}>
            {columns.map((column) => (
              <td key={column.key}>
                {column.render ? column.render(row) : row[column.key]}
              </td>
            ))}
            <td className="cell-actions">
              <button
                type="button"
                onClick={() => onArchive(row.Id)}
                className="btn-sm btn-danger"
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
