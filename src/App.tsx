import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <Header />
      <Sidebar />
      <MainContent />
    </div>
  );
}

export default App;
