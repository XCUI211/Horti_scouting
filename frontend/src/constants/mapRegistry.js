// This is needed to PREVENT mismatch in scout maps page
import RijsenhoutMap from "../components/AllMaps/Rijsenhout";
import HW53Map from "../components/AllMaps/hw.53";
import HW1011Map from "../components/AllMaps/hw.10.11";
import HW1012Map from "../components/AllMaps/hw.10.12";
import HW1013Map from "../components/AllMaps/hw.10.13";
import HW1014Map from "../components/AllMaps/hw.10.14";
import HW1015Map from "../components/AllMaps/hw.10.15";
import HW1016Map from "../components/AllMaps/hw.10.16";
import HW1017Map from "../components/AllMaps/hw.10.17";
import HW15Map from "../components/AllMaps/hw.15";
import Leg from "../components/AllMaps/Leg";
import Plattergrond13 from "../components/AllMaps/Plattergrond13";
import Plattergrond29 from "../components/AllMaps/Plattergrond29";

export const MAP_COMPONENTS = {
  "Rijsenhout": RijsenhoutMap,
  "Legmeerdijk": Leg,
  "HW 10.11": HW1011Map,
  "HW 10.12": HW1012Map,
  "HW 10.13": HW1013Map,
  "HW 10.14": HW1014Map,
  "HW 10.15": HW1015Map,
  "HW 10.16": HW1016Map,
  "HW 10.17": HW1017Map,
  "HW 13": Plattergrond13,
  "HW 15": HW15Map,
  "HW 29": Plattergrond29,
  "HW 53": HW53Map,
};
