import "./index.css";
import PropTypes from "prop-types";

export const ArticleCard = ({ children }) => {
  return <article className="article-card">{children}</article>;
};

ArticleCard.propTypes = {
  children: PropTypes.node.isRequired
};
