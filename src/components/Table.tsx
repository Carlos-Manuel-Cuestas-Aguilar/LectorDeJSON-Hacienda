import dayjs from 'dayjs';

// Define el tipo para las filas de datos
interface DataItem {
  nit: string;
  dteJson: {
    emisor: {
      nombre: string;
    };
    receptor: {
      nombre: string;
    };
    identificacion: {
      fecEmi: string; // Fecha de emisión
    };
  };
}

interface TableProps {
  data: DataItem[];
}

const Table: React.FC<TableProps> = ({ data }) => (
  <table className="mx-auto border-collapse w-full max-w-2xl">
    <thead>
      <tr>
        {/* Encabezados de la tabla */}
        <th className="border border-gray-300 p-2">NIT</th>
        <th className="border border-gray-300 p-2">Emisor</th>
        <th className="border border-gray-300 p-2">Receptor</th>
        <th className="border border-gray-300 p-2">Fecha</th>
      </tr>
    </thead>
    <tbody>
      {/* Filas de datos */}
      {data.map((item, index) => (
        <tr key={index}>
          {/* Celdas de datos */}
          <td className="border border-gray-300 p-2">{item.nit}</td>
          <td className="border border-gray-300 p-2">{item.dteJson.emisor.nombre}</td>
          <td className="border border-gray-300 p-2">{item.dteJson.receptor.nombre}</td>
          <td className="border border-gray-300 p-2">{dayjs(item.dteJson.identificacion.fecEmi).format('YYYY-MM-DD')}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default Table;
