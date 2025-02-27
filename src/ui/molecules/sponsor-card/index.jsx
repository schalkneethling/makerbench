import "./index.css";
import PropTypes from "prop-types";

export const SponsorCard = ({ children }) => {
  return <article className="sponsor-card">{children}</article>;
};

SponsorCard.propTypes = {
  children: PropTypes.node.isRequired
};
