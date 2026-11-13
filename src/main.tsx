import { render } from "preact";
import { App } from "./App";
import { initData, startTelegram } from "./tg";
import { load } from "./store";
import "./style.css";

startTelegram();
render(<App />, document.getElementById("app")!);
void load(!!initData());
