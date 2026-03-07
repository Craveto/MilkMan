import React, { useState, useEffect } from 'react';
import '../styles/DataTable.css';

function DataTable({ title, columns, data, loading, onEdit, onDelete, onAdd }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const displayedData = filteredData.slice(startIdx, startIdx + itemsPerPage);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="data-table-container">
      <div className="table-header">
        <h2>{title}</h2>
        <button className="btn btn-primary" onClick={onAdd}>
          ➕ Add New
        </button>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="search-input"
        />
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedData.length > 0 ? (
              displayedData.map((item, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(item[col.key], item) : item[col.key]}
                    </td>
                  ))}
                  <td className="actions">
                    <button
                      className="btn btn-sm btn-edit"
                      onClick={() => onEdit(item)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-sm btn-delete"
                      onClick={() => {
                        if (window.confirm('Are you sure?')) {
                          onDelete(item);
                        }
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center' }}>
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className="btn btn-sm"
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="btn btn-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default DataTable;
