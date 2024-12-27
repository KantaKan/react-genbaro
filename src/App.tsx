import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import FormComponent from "./component/FormComponent";
import BaroCard from "./component/BaroCard";
import CardContainer from "./component/CardContainer";

function App() {
  return (
    <>
      <div>
        <FormComponent />
      </div>
      <div className="flex items-center justify-center">
        <BaroCard name="hello" picture="https://upload.wikimedia.org/wikipedia/commons/a/a7/Haerin_Seoul_Fashion_Week_3.jpg" feels="Good" />
      </div>
      <CardContainer />
    </>
  );
}

export default App;
