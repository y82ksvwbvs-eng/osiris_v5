import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HOME } from "@/constants/testIds";

const Home = () => {
  return (
    <div>
      <header className="App-header">
        <span data-testid={HOME.emergentLink} className="App-link">
          OSIRIS
        </span>
        <p className="mt-5">Building something incredible ~!</p>
      </header>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}>
            <Route index element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
