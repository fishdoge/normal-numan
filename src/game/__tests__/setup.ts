// 全域測試設定:天地靈氣(5.4 版)隨現實時間變化,預設關閉,讓傷害相關測試不隨日期浮動;
// 需要天氣的測試自行 setWeatherOverride。
import { setWeatherOverride } from "../data/weather";

setWeatherOverride(null);
