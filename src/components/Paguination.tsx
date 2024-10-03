import React from 'react';

interface PaginationProps {
  itemsPerPage: number;
  totalItems: number;
  paginate: (page: number) => void;
  currentPage: number;
}

const Pagination: React.FC<PaginationProps> = ({
  itemsPerPage,
  totalItems,
  paginate,
  currentPage,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Determina el rango de páginas a mostrar
  const pageNumbers: number[] = [];
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, currentPage + 1);

  // Ajusta el rango si hay menos de 3 páginas entre startPage y endPage
  if (endPage - startPage < 2) {
    if (startPage === 1) {
      endPage = Math.min(3, totalPages);
    } else if (endPage === totalPages) {
      startPage = Math.max(1, totalPages - 2);
    }
  }

  // Llena el array de números de página
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex items-center justify-center mt-5">
      {/* Botón para ir a la primera página */}
      <button
        onClick={() => paginate(1)}
        disabled={currentPage === 1}
        className={`px-4 py-2 mx-1 text-white bg-blue-600 rounded hover:bg-blue-700 ${
          currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        &laquo; Primero
      </button>

      {/* Botón para ir a la página anterior */}
      <button
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-4 py-2 mx-1 text-white bg-blue-600 rounded hover:bg-blue-700 ${
          currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        &lt; Anterior
      </button>

      {/* Botones para cada número de página */}
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => paginate(number)}
          className={`px-4 py-2 mx-1 text-white rounded border ${
            currentPage === number
              ? 'bg-blue-600 border-blue-700'
              : 'bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white'
          }`}
        >
          {number}
        </button>
      ))}

      {/* Botón para ir a la página siguiente */}
      <button
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 mx-1 text-white bg-blue-600 rounded hover:bg-blue-700 ${
          currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        &gt; Siguiente
      </button>

      {/* Botón para ir a la última página */}
      <button
        onClick={() => paginate(totalPages)}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 mx-1 text-white bg-blue-600 rounded hover:bg-blue-700 ${
          currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        &raquo; Último
      </button>
    </div>
  );
};

export default Pagination;
