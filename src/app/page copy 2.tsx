'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import dayjs from 'dayjs';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Table from '../components/Table';
import Pagination from '../components/Pagination'; // Cambiado a Pagination en lugar de Paguination

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

  const [showFiles, setShowFiles] = useState(true); 
  const filesPerPage = 10;
  const dataPerPage = 10;

  const onDrop = (acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result as string);
          setData((prevData) => {
            const updatedData = [...prevData, json];
            const tipoDtes = new Set(updatedData.map((item) => item.dteJson.identificacion.tipoDte));
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

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleTipoDteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value;
    setSelectedTipoDte(selected);
    setSelectedMonths([]);
    const filteredData = data.filter((item) => item.dteJson.identificacion.tipoDte === selected);
    const months = new Set(filteredData.map((item) => dayjs(item.dteJson.identificacion.fecEmi).format('YYYY-MM')));
    setAvailableMonths(Array.from(months).sort((a, b) => dayjs(a).isAfter(dayjs(b)) ? 1 : -1));
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedMonths((prev) => checked ? [...prev, value] : prev.filter((month) => month !== value));
  };

  const filteredData = data.filter(
    (item) =>
      item.dteJson.identificacion.tipoDte === selectedTipoDte &&
      (selectedMonths.length === 0 || selectedMonths.includes(dayjs(item.dteJson.identificacion.fecEmi).format('YYYY-MM')))
  );

  const filteredDataForSearch = filteredData.filter(
    (item) =>
      item.nit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.dteJson.emisor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.dteJson.receptor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dayjs(item.dteJson.identificacion.fecEmi).format('YYYY-MM-DD').includes(searchTerm.toLowerCase())
  );

  const chartData = {
    labels: filteredData.map((item) => dayjs(item.dteJson.identificacion.fecEmi).format('YYYY-MM-DD')),
    datasets: [{
      label: 'Total a Pagar',
      data: filteredData.map((item) => item.dteJson.resumen.totalPagar),
      borderColor: 'rgba(0, 0, 0, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: false,
    }],
  };

  const paginate = (page: number, setCurrentPage: React.Dispatch<React.SetStateAction<number>>) => setCurrentPage(page);

  const handleSave = async () => {
    const zip = new JSZip();
    filteredData.forEach((item, index) => {
      zip.file(`file_${index + 1}.json`, JSON.stringify(item, null, 2));
    });
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${selectedTipoDte}_${selectedMonths.join('-')}.zip`);
  };

  return (
    <div className="p-5 text-center font-sans bg-white text-black space-y-5">
      {/* Dropzone para archivos JSON */}
      <div
        {...getRootProps()}
        className="border-dashed border-2 border-blue-500 p-5 mb-5 mx-auto max-w-md"
      >
        <input {...getInputProps()} />
        <p>Arrastra y suelta tus archivos JSON aquí, o haz clic para seleccionar archivos</p>
      </div>

      {/* Botón para mostrar/ocultar archivos subidos */}
      <button
        onClick={() => setShowFiles(prev => !prev)}
        className="mb-5 px-5 py-2 bg-blue-500 text-white rounded cursor-pointer"
      >
        {showFiles ? 'Ocultar Archivos Subidos' : 'Mostrar Archivos Subidos'}
      </button>

      {/* Sección para mostrar archivos subidos y su paginación */}
      {files.length > 0 && (
        <div className="border border-gray-300 p-5 mx-auto max-w-md">
          {showFiles && (
            <>
              <div className="border border-gray-300 p-5 mx-auto max-w-md">
                <h3>Archivos subidos:</h3>
                <ul className="list-none pl-0">
                  {files.slice((currentPageFiles - 1) * filesPerPage, currentPageFiles * filesPerPage).map((file) => (
                    <li key={file.path} className="mb-1">{file.name}</li>
                  ))}
                </ul>
                <Pagination itemsPerPage={filesPerPage} totalItems={files.length} paginate={(page) => paginate(page, setCurrentPageFiles)} currentPage={currentPageFiles} />
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-5 w-full">
        {/* Filtros de Tipo DTE y Mes */}
        <div className="border border-gray-300 p-5 lg:w-1/3 flex-1">
          <h3>Filtrar por Tipo DTE:</h3>
          <select onChange={handleTipoDteChange} value={selectedTipoDte} className="p-2 rounded border border-gray-300 w-full">
            <option value="">Selecciona un Tipo DTE</option>
            {Object.entries(tipoDteLabels).map(([code, label]) => (
              <option key={code} value={code}>{`${code} ${label}`}</option>
            ))}
          </select>

          {selectedTipoDte && (
            <>
              <h3>Filtrar por Mes:</h3>
              {availableMonths.map((month) => (
                <label key={month} className="mr-2">
                  <input type="checkbox" value={month} onChange={handleMonthChange} />
                  {dayjs(month, 'YYYY-MM').format('MMMM YYYY')}
                </label>
              ))}
            </>
          )}

          {/* Buscador y Datos Consolidados */}
          <div className="border border-gray-300 p-5 mt-5">
            <h3>Buscador de Datos Consolidados:</h3>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por NIT, Nombre Emisor, Nombre Receptor, Fecha"
              className="p-2 rounded border border-gray-300 w-full"
            />

            <h3>Datos Consolidados:</h3>
            <Table data={filteredDataForSearch.slice((currentPageData - 1) * dataPerPage, currentPageData * dataPerPage)} />

            <Pagination itemsPerPage={dataPerPage} totalItems={filteredDataForSearch.length} paginate={(page) => paginate(page, setCurrentPageData)} currentPage={currentPageData} />
          </div>
        </div>

        {/* Gráfica Lineal */}
        <div className="border border-gray-300 p-5 lg:w-2/3 flex-1">
          <h3>Gráfica Lineal:</h3>
          <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (context) => `Total a Pagar: ${context.raw}` } } } }} />
        </div>
      </div>
      <button
        onClick={handleSave}
        className="px-5 py-2 bg-blue-500 text-white rounded cursor-pointer mt-5"
      >
        Descargar Datos
      </button>

    </div>
   
  );
};

export default Home;
