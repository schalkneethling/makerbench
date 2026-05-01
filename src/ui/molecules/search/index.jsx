import PropTypes from "prop-types";
import { Suggestions } from "../suggestions";

import "./index.css";

export const Search = ({
  handleChange,
  onSubmitCallback,
  searchString,
  tools,
}) => {
  return (
    <>
      <p>
        The search is based on tags. Try searching for{" "}
        <button onClick={() => onSubmitCallback("repl")}>repl</button>,{" "}
        <button onClick={() => onSubmitCallback("utility")}>utility</button> or{" "}
        <button onClick={() => onSubmitCallback("design")}>design</button> for
        example.
      </p>
      <form
        name="search-tools"
        action="/search"
        className="search-tools"
        method="get"
        onSubmit={(event) => onSubmitCallback(searchString, event)}
      >
        <label htmlFor="search" className="visually-hidden">
          Enter tags separated by spaces
        </label>
        <input
          id="search"
          type="search"
          name="search"
          value={searchString}
          placeholder="Enter tags separated by spaces"
          list="suggestions"
          onChange={handleChange}
        />
        {tools && <Suggestions tools={tools} />}
        <button type="submit">Search</button>
      </form>
    </>
  );
};

Search.propTypes = {
  handleChange: PropTypes.func.isRequired,
  onSubmitCallback: PropTypes.func.isRequired,
  searchString: PropTypes.string.isRequired,
  tools: PropTypes.array
};
