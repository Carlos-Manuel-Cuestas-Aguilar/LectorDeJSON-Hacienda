'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import dayjs from 'dayjs';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const tipoDteLabels: Record<string, string> = {
  '01': 'Factura',
  '03': 'Comprobante de crédito fiscal',
  '04': 'Nota de remisión',
  '05': 'Nota de crédito',
  '06': 'Nota de débito',
  '07': 'Comprobante de retención',
  '08': 'Comprobante de liquidación',
  '09': 'Documento contable de liquidación',
  '11': 'Facturas de exportación',
  '14': 'Factura de sujeto excluido',
  '15': 'Comprobante de donación',
};

const findProperty = (obj: any, property: string) => {
  if (typeof obj !== 'object' || obj === null) {
    return null;
  }

  if (property in obj) {
    return obj[property];
  }

  for (const key in obj) {
    const result = findProperty(obj[key], property);
    if (result !== null) {
      return result;
    }
  }

  return null;
};

// Función para verificar si un archivo tiene los campos completos
const checkFileCompleteness = (data: any) => {
  const isComplete = findProperty(data, 'codigoGeneracion') && findProperty(data, 'numeroControl');
  const missingFields = [];

  if (!findProperty(data, 'codigoGeneracion')) {
    missingFields.push('codigoGeneracion');
  }
  if (!findProperty(data, 'numeroControl')) {
    missingFields.push('numeroControl');
  }



  return { isComplete, missingFields };
};

const Home = () => {
  // Estados
  const [files, setFiles] = useState<File[]>([]);
  const [data, setData] = useState<any[]>([]);

  const [selectedTipoDte, setSelectedTipoDte] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [availableTipoDtes, setAvailableTipoDtes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPageFiles, setCurrentPageFiles] = useState(1);
  const [currentPageData, setCurrentPageData] = useState(1);

  const [currentPageCompleteFiles, setCurrentPageCompleteFiles] = useState(1);
  const [currentPageIncompleteFiles, setCurrentPageIncompleteFiles] = useState(1);

  const [archivosCompletos, setArchivosCompletos] = useState([]);
    const [archivosIncompletos, setArchivosIncompletos] = useState([]);
    const [nombresArchivos, setNombresArchivos] = useState({ completos: [], incompletos: [] });


  const [showFiles, setShowFiles] = useState(true);
  const filesPerPage = 10;
  const dataPerPage = 10;


  
  const onDrop = (acceptedFiles: File[]) => {
    // Guardar los archivos subidos, incluyendo su nombre
    setFiles((prevFiles) => [
      ...prevFiles,
      ...acceptedFiles.map((file) => ({ file, name: file.name }))
    ]);
  
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result as string);
  
          // Extrae los datos necesarios de la estructura JSON, sin importar su jerarquía
          const tipoDte = findProperty(json, 'tipoDte');
          const fecEmi = findProperty(json, 'fecEmi');
          const nit = findProperty(json, 'nit');
          const emisorNombre = findProperty(json, 'emisor')?.nombre;
          const receptorNombre = findProperty(json, 'receptor')?.nombre;
          const totalPagar = findProperty(json, 'resumen')?.totalPagar;
  
          const formattedData = {
            dteJson: json,
            identificacion: { tipoDte, fecEmi },
            nit,
            emisor: { nombre: emisorNombre },
            receptor: { nombre: receptorNombre },
            resumen: { totalPagar },
          };
  
          setData((prevData) => {
            const updatedData = [...prevData, formattedData];
            const tipoDtes = new Set(updatedData.map((item) => item.identificacion.tipoDte));
            setAvailableTipoDtes(Array.from(tipoDtes));
            return updatedData;
          });
  
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      };
      reader.readAsText(file);
    });
  };
  

  const handleClearFiles = () => {
    const confirmClear = window.confirm("¿Estás seguro de que deseas limpiar todos los archivos subidos?");
    if (confirmClear) {
      setFiles([]);
      setData([]);
      setAvailableTipoDtes([]);
      setAvailableMonths([]);
      setSelectedTipoDte('');
      setSelectedMonths([]);
      setSearchTerm('');
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleTipoDteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value;
    setSelectedTipoDte(selected);
    setSelectedMonths([]);
    const filteredData = data.filter((item) => item.identificacion.tipoDte === selected);
    const months = new Set(filteredData.map((item) => dayjs(item.identificacion.fecEmi).format('YYYY-MM')));
    setAvailableMonths(Array.from(months).sort((a, b) => dayjs(a).isAfter(dayjs(b)) ? 1 : -1));
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedMonths((prev) => checked ? [...prev, value] : prev.filter((month) => month !== value));
  };

  
  const filteredData = data.filter(
    (item) =>
      item.identificacion.tipoDte === selectedTipoDte &&
      (selectedMonths.length === 0 || selectedMonths.includes(dayjs(item.identificacion.fecEmi).format('YYYY-MM')))
  );

  const filteredDataForSearch = filteredData.filter(
    (item) =>
      item.nit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.dteJson.emisor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.dteJson.receptor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dayjs(item.dteJson.identificacion.fecEmi).format('YYYY-MM-DD').includes(searchTerm.toLowerCase())
  );

  const chartData = {
    labels: filteredData.map((item) => dayjs(item.identificacion.fecEmi).format('YYYY-MM-DD')),
    datasets: [{
      label: 'Total a Pagar',
      data: filteredData.map((item) => item.resumen.totalPagar),
      borderColor: '#ff6d3cff',
      backgroundColor: 'white',
      fill: false,
    }],
  };

  const handleSave = async () => {
    const confirmDownload = window.confirm("¿Estás seguro de que deseas descargar solo los archivos completos?");
    if (confirmDownload) {
      const zip = new JSZip();
  
      // Filtramos solo los archivos completos
      const completeData = filteredData.filter((item) => {
        const { isComplete } = checkFileCompleteness(item.dteJson);
        return isComplete;
      });
  
      if (completeData.length === 0) {
        window.alert("No hay archivos completos para descargar.");
        return;
      }
  
      completeData.forEach((item, index) => {
        zip.file(`file_${index + 1}.json`, JSON.stringify(item, null, 2));
      });
  
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${selectedTipoDte}_${selectedMonths.join('-')}_completos.zip`);
    }
  };
  

  // Filtramos archivos completos e incompletos
  const completeFiles = filteredData.filter((item) => {
    const { isComplete } = checkFileCompleteness(item.dteJson);
    return isComplete;
  });

  const incompleteFiles = filteredData.filter((item) => {
    const { isComplete } = checkFileCompleteness(item.dteJson);
    return !isComplete;
  });

  
  

  return (
    <div className="p-5 text-center font-sans bg-white text-black space-y-5">
      {/* Dropzone para archivos JSON */}
      <div
        {...getRootProps()} style={{ borderColor: '#ff6d3cff' }}
        className="border-dashed border-2 border-blue-500 p-5 mb-5 mx-auto max-w-md"
      >
        <input {...getInputProps()} />
        <p>Arrastra y suelta tus archivos JSON aquí, o haz clic para seleccionar archivos</p>
      </div>

      {files.length > 0 && (
      <h3>Archivos: {files.length}</h3>
      )}
      
      {/* Botón para mostrar/ocultar archivos subidos */}
      {files.length > 0 && (
        
      <button
        onClick={handleClearFiles}
        className="mb-5 px-5 py-2 bg-red-500 text-white rounded cursor-pointer"
      >
        Limpiar Archivos Subidos
      </button>)}

      {files.length > 0 && (
      <button style={{ backgroundColor: '#ff6d3cff' }}
        onClick={() => setShowFiles(prev => !prev)}
        className="mb-5 px-5 py-2 bg-blue-500 text-white rounded cursor-pointer"
      >
        {showFiles ? 'Ocultar Archivos Subidos' : 'Mostrar Archivos Subidos'}
      </button>
      )}

      {/* Sección para mostrar archivos subidos y su paginación */}
      {files.length > 0 && (
        <div className="p-5 mx-auto max-w-md">
          {showFiles && (
            <>
              <div className="border border-gray-300 p-5 mx-auto max-w-md">
                <h3>Archivos subidos:</h3>
                <ul className="list-none pl-0">
                  {files.slice((currentPageFiles - 1) * filesPerPage, currentPageFiles * filesPerPage).map((file) => (
                    <li key={file.path} className="mb-1">{file.name}</li>
                  ))}
                </ul>
                <Pagination 
        itemsPerPage={filesPerPage} 
        totalItems={files.length} 
        paginate={(page) => paginate(page, setCurrentPageFiles)} 
        currentPage={currentPageFiles} 
      />
              </div>
            </>
          )}
          <h3>Filtrar por Tipo DTE:</h3>
          <select onChange={handleTipoDteChange} value={selectedTipoDte} className="p-2 rounded border border-gray-300 w-full bg-white text-orange-500">
            <option value="">Selecciona un Tipo DTE</option>
            {Object.entries(tipoDteLabels).map(([code, label]) => (
              <option key={code} value={code}>{`${code} ${label}`}</option>
            ))}
          </select>

            {/* Mensaje si no hay tipo de DTE seleccionado */}
          {selectedTipoDte && availableMonths.length === 0 && (
            <p>No existen archivos para el Tipo DTE seleccionado.</p>
            
          )}
  
          {selectedTipoDte && availableMonths.length > 0 && (
            <>
              <h3>Filtrar por Mes:</h3>
              {availableMonths.map((month) => (
                <label key={month} className="mr-2">
                  <input
                    type="checkbox"
                    value={month}
                    checked={selectedMonths.includes(month)}
                    onChange={handleMonthChange}
                  />
                  {dayjs(month, 'YYYY-MM').format('MMMM YYYY')}
                </label>
              ))}
            </>
          )}

        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-5 w-full">
        {/* Filtros de Tipo DTE y Mes */}
        {files.length > 0 && (
        <div className="border border-gray-300 p-5 lg:w-1/3 flex-1">
          
          <div
  {...getRootProps()}
  style={{ borderColor: '#ff6d3cff' }}
  className="border-dashed border-2 border-blue-500 p-5 mb-5 mx-auto w-80 h-60 flex flex-col justify-center items-center text-center"
>
  <input {...getInputProps()} />
  <p>Arrastra y suelta tus archivos JSON aquí, o haz clic para seleccionar archivos</p>
</div>


          {/* Archivos Filtrados Completos */}
          {selectedTipoDte && completeFiles.length > 0 && (
  <div className="border border-gray-300 p-5 mx-auto max-w-md">
    <h3 className='text-orange-500'>Archivos Filtrados Completos:{completeFiles.length}</h3>
    
    <hr className="border-orange-500"></hr>
    <ul className="list-none pl-0">
    {files
    .slice((currentPageCompleteFiles - 1) * filesPerPage, currentPageCompleteFiles * filesPerPage)
    .map((fileObj, index) => (
      <li key={index} className="mb-1 text-green-800">
        {//`Archivo ${index + 1} - Nombre: ${fileObj.name} - NIT: ${fileObj.nit} - Emisor: ${fileObj.emisor?.nombre || 'Desconocido'}`
        }
        {`${fileObj.name} `}
      </li>
    ))}
    </ul>
    <Pagination 
      itemsPerPage={filesPerPage} 
      totalItems={completeFiles.length} 
      paginate={(page) => setCurrentPageCompleteFiles(page)} 
      currentPage={currentPageCompleteFiles} 
    />
  </div>
)}
<br></br>
      {/* Archivos Filtrados Incompletos */}
      {selectedTipoDte && incompleteFiles.length > 0 && (
  <div className="border border-red-500 p-5 mx-auto max-w-md">
    <h3 className='text-orange-500'>Archivos Filtrados Incompletos:{incompleteFiles.length}</h3>
    <hr className="border-orange-500"></hr>
    <ul className="list-none pl-0">
      {files
        .slice((currentPageIncompleteFiles - 1) * filesPerPage, currentPageIncompleteFiles * filesPerPage)
        .map((fileObj, index) => {
          // Obtener los campos faltantes usando la función checkFileCompleteness
          const { missingFields } = checkFileCompleteness(fileObj.dteJson);
          return (
            <li key={index} className="mb-1">
              {`${fileObj.name}: `}<p className='text-red-500'>{`- Faltan: ${missingFields.join(', ')}`}</p>
            </li>
          );
        })}
    </ul>
    <Pagination 
      itemsPerPage={filesPerPage} 
      totalItems={incompleteFiles.length} 
      paginate={(page) => setCurrentPageIncompleteFiles(page)} 
      currentPage={currentPageIncompleteFiles} 
    />
  </div>
)}

          </div>
                


          
      
        )}
        {/* Gráfica Lineal */}
        {selectedTipoDte && filteredData.length > 0 && (
        <div className="border border-gray-300 p-5 lg:w-2/3 flex-1">
          <h3>Gráfica Lineal:</h3>
          <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (context) => `Total a Pagar: ${context.raw}` } } } }} />
            {/* Buscador y Datos Consolidados */}
          {selectedTipoDte && filteredData.length > 0 && (
          <div className="border border-gray-300 p-5 mt-5">
            <h3>Buscador de Datos Consolidados:</h3>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por NIT, Nombre Emisor, Nombre Receptor, Fecha"
              className="p-2 rounded border border-gray-300 w-full"
            />

            <h3>Datos Consolidados ({filteredDataForSearch.length} archivos filtrados):</h3>
            <h3>Datos Consolidados:</h3>
            <Table data={filteredDataForSearch.slice((currentPageData - 1) * dataPerPage, currentPageData * dataPerPage)} />

            <Pagination 
        itemsPerPage={dataPerPage} 
        totalItems={filteredDataForSearch.length} 
        paginate={(page) => paginate(page, setCurrentPageData)} 
        currentPage={currentPageData} 
      />
          </div>
          )}
        </div>
        )}
      </div>
          

{selectedTipoDte && filteredData.length > 0 && (
      <button style={{ backgroundColor: '#ff6d3cff' }}
      onClick={() => {
    if (files.length === 0 || !selectedTipoDte || selectedMonths.length === 0) {
      alert('Por favor, sube archivos y selecciona un Tipo DTE y al menos un mes antes de descargar.');
      return;
    }
    handleSave();
  }}
  className="px-5 py-2 bg-blue-500 text-white rounded cursor-pointer mt-5 ${files.length === 0 || !selectedTipoDte || filteredData.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
>
  Descargar Datos
</button>
)}

    </div>

  );
};

const Table = ({ data }: { data: any[] }) => (
  <table className="mx-auto border-collapse w-full max-w-2xl">
    <thead>
      <tr>
        <th className="border border-gray-300 p-2">NIT</th>
        <th className="border border-gray-300 p-2">Emisor</th>
        <th className="border border-gray-300 p-2">Receptor</th>
        <th className="border border-gray-300 p-2">Total a Pagar</th>
        <th className="border border-gray-300 p-2">Fecha</th>
      </tr>
    </thead>
    <tbody>
      {data.map((item, index) => (
        <tr key={index}>
          <td className="border border-gray-300 p-2">{item.nit}</td>
          <td className="border border-gray-300 p-2">{item.emisor.nombre}</td>
          <td className="border border-gray-300 p-2">{item.receptor.nombre}</td>
          <td className="border border-gray-300 p-2">{item.resumen.totalPagar}</td>
          <td className="border border-gray-300 p-2">{dayjs(item.identificacion.fecEmi).format('YYYY-MM-DD')}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const paginate = (pageNumber: number, setPage: React.Dispatch<React.SetStateAction<number>>) => {
  setPage(pageNumber);
};

const Pagination = ({ itemsPerPage, totalItems, paginate, currentPage }) => {
  const pageNumbers = [];
  const totalPages = Math.ceil(totalItems / itemsPerPage);


  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, currentPage + 1);


  if (endPage - startPage < 2) {
    if (startPage === 1) {
      endPage = Math.min(3, totalPages);
    } else if (endPage === totalPages) {
      startPage = Math.max(1, totalPages - 2);
    }
  }


  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex items-center justify-center mt-5">
      <button
      style={{ backgroundColor: '#ff6d3cff' }}
        onClick={() => paginate(1)}
        disabled={currentPage === 1}
        className={`px-4 py-2 mx-1 text-white bg-blue-600 rounded hover:bg-blue-700 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
      >
        &laquo; 
      </button>
      <button
      style={{ backgroundColor: '#ff6d3cff' }}
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-4 py-2 mx-1 text-white bg-blue-600 rounded hover:bg-blue-700 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
      >
        &lt; 
      </button>

      {pageNumbers.map((number) => (
        <button
        style={{ backgroundColor: '#ff6d3cff' }}
          key={number}
          onClick={() => paginate(number)}
          className={`px-4 py-2 mx-1 text-white rounded border ${currentPage === number
              ? 'bg-blue-600 border-blue-700'
              : 'bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white'
            }`}
        >
          {number}
        </button>
      ))}

      <button
      style={{ backgroundColor: '#ff6d3cff' }}
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-2 py-2 mx-1 text-white bg-blue-600 rounded hover:bg-blue-700 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
          }`}
      >
        &gt; 
      </button>
      <button
      style={{ backgroundColor: '#ff6d3cff' }}
        onClick={() => paginate(totalPages)}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 mx-1 text-white bg-blue-600 rounded hover:bg-blue-700 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
          }`}
      >
        &raquo; 
      </button>
    </div>
  );
};


export default Home;
