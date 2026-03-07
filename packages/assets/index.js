import biancaPizza from "./images/bianca-pizza.jpg";
import californiaPizza from "./images/california-pizza.png";
import creamyPizza from "./images/creamy-pizza.png";
import detroitStyle from "./images/detroit-style.jpg";
import flatbread from "./images/flatbread.jpg";
import gardenSalad from "./images/garden-salad.png";
import loadedFries from "./images/loaded-fries.png";
import marinara from "./images/marinara.jpg";
import noodlesSpecial from "./images/noodles-special.png";
import pestoPizza from "./images/pesto-pizza.png";
import pizzaCapricciosa from "./images/pizza-capricciosa.jpg";
import pizzaClasssic from "./images/pizza-classic.png";
import pizzaMargherita from "./images/pizza-margherita.png";
import pizzaPartyAlt from "./images/pizza-party-alt.jpg";
import pizzaParty from "./images/pizza-party.jpg";
import pizzaPepperoni from "./images/pizza-pepperoni.jpg";
import pizzaRed from "./images/pizza-red.png";
import pizzaRound from "./images/pizza-round.png";
import pizzaTomato from "./images/pizza-tomato.png";
import spicyFries from "./images/spicy-fries.png";
import stirFry from "./images/stir-fry.png";
import tomatoPizza from "./images/tomato-pizza.png";
import trufflePizza from "./images/truffle-pizza.jpg";
import veggieBowl from "./images/veggie-bowl.png";
import veggiePizza from "./images/veggie-pizza.png";
import whitePizza from "./images/white-pizza.png";

export const assetMap = {
  "asset:bianca-pizza": biancaPizza,
  "asset:california-pizza": californiaPizza,
  "asset:creamy-pizza": creamyPizza,
  "asset:detroit-style": detroitStyle,
  "asset:flatbread": flatbread,
  "asset:garden-salad": gardenSalad,
  "asset:loaded-fries": loadedFries,
  "asset:marinara": marinara,
  "asset:noodles-special": noodlesSpecial,
  "asset:pesto-pizza": pestoPizza,
  "asset:pizza-capricciosa": pizzaCapricciosa,
  "asset:pizza-classic": pizzaClasssic,
  "asset:pizza-margherita": pizzaMargherita,
  "asset:pizza-party": pizzaParty,
  "asset:pizza-party-alt": pizzaPartyAlt,
  "asset:pizza-pepperoni": pizzaPepperoni,
  "asset:pizza-red": pizzaRed,
  "asset:pizza-round": pizzaRound,
  "asset:pizza-tomato": pizzaTomato,
  "asset:spicy-fries": spicyFries,
  "asset:stir-fry": stirFry,
  "asset:tomato-pizza": tomatoPizza,
  "asset:truffle-pizza": trufflePizza,
  "asset:veggie-bowl": veggieBowl,
  "asset:veggie-pizza": veggiePizza,
  "asset:white-pizza": whitePizza
};

export function resolveAssetSource(source) {
  if (!source) {
    return "";
  }

  if (source.startsWith("data:") || source.startsWith("http")) {
    return source;
  }

  return assetMap[source] || "";
}
