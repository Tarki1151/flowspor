import { useState, useEffect } from 'react';
import { fetchReports, fetchReport, generateMembershipReport, generateFinancialReport, generateEquipmentUsageReport, downloadReportCSV } from './api';
import { Bar, Line, Pie } from 'react-chartjs-2';
import 'chart.js/auto';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => { loadReports(); }, []);
  async function loadReports() { setReports(await fetchReports()); }
  async function handleSelect(id) {
    setSelected(id);
    setReport(await fetchReport(id));
  }
  async function handleGenerate(type) {
    setMessage('');
    let res;
    if (type === 'membership') res = await generateMembershipReport();
    if (type === 'financial') res = await generateFinancialReport();
    if (type === 'equipment_usage') res = await generateEquipmentUsageReport();
    if (res && !res.error) {
      setMessage('Rapor oluşturuldu.');
      loadReports();
    } else setMessage(res.error);
  }
  async function handleDownloadCSV(id) {
    await downloadReportCSV(id);
  }
  // Grafik hazırlama yardımcıları
  function renderChart() {
    if (!report) return null;
    if (report.type === 'membership') {
      const labels = report.data.registrations.map(r=>r.period).reverse();
      const regData = report.data.registrations.map(r=>r.registrations).reverse();
      const canData = labels.map(p => {
        const c = report.data.cancellations.find(x=>x.period===p);
        return c ? c.cancellations : 0;
      });
      return <Line data={{labels, datasets:[
        {label:'Kayıtlar',data:regData,backgroundColor:'#4caf50',borderColor:'#388e3c'},
        {label:'İptaller',data:canData,backgroundColor:'#d7263d',borderColor:'#b71c1c'}
      ]}} />;
    }
    if (report.type === 'financial') {
      return <Pie data={{labels:['Gelir','Gider','Kar'],datasets:[{data:[report.data.revenue,report.data.expenses,report.data.profit],backgroundColor:['#4caf50','#d7263d','#607d8b']} ]}} />;
    }
    if (report.type === 'equipment_usage') {
      const labels = report.data.map(r=>r.name);
      const data = report.data.map(r=>r.usage_count);
      return <Bar data={{labels,datasets:[{label:'Kullanım',data,backgroundColor:'#607d8b'}]}} />;
    }
    return null;
  }
  return (
    <div>
      <h2>Raporlar & Analitik</h2>
      <div style={{display:'flex',gap:'1rem',flexWrap:'wrap',marginBottom:16}}>
        <button onClick={()=>handleGenerate('membership')}>Üyelik Raporu Oluştur</button>
        <button onClick={()=>handleGenerate('financial')}>Finansal Rapor Oluştur</button>
        <button onClick={()=>handleGenerate('equipment_usage')}>Ekipman Kullanım Raporu Oluştur</button>
        {message && <span className="message">{message}</span>}
      </div>
      <div style={{display:'flex',gap:'2rem',flexWrap:'wrap'}}>
        <div style={{flex:'1 1 300px',minWidth:250}}>
          <h3>Geçmiş Raporlar</h3>
          <table className="member-table">
            <thead><tr><th>Tarih</th><th>Tip</th><th>İşlem</th></tr></thead>
            <tbody>
              {reports && reports.length>0 ? reports.map(r=>(
                <tr key={r.id}>
                  <td>{r.date}</td><td>{r.type}</td>
                  <td>
                    <button onClick={()=>handleSelect(r.id)}>Görüntüle</button>
                    <button onClick={()=>handleDownloadCSV(r.id)}>CSV</button>
                  </td>
                </tr>
              )) : <tr><td colSpan="3">Kayıt yok.</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{flex:'2 1 400px',minWidth:300}}>
          {report && (
            <>
              <h3>Rapor Detayı</h3>
              <div style={{maxWidth:600}}>{renderChart()}</div>
              <pre style={{background:'#f5f5f5',padding:8,marginTop:16}}>{JSON.stringify(report.data,null,2)}</pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
