import React, { useState } from "react";

const SearchBar = ({ searchTerm, onSearch }) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative w-[350px] grid place-items-center transition-all duration-300">
      <input
        type="text"
        className={`w-full px-4 py-2 border-b-2 outline-none transition-all duration-300 ${
          focused
            ? "border-blue-500 shadow-lg w-[450px]" // Expands on focus
            : "border-gray-300"
        }`}
        placeholder="Type to search..."
        value={searchTerm} // Keeps track of user input
        onChange={(e) => onSearch(e.target.value)} // ✅ Fix: Pass only the input value
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
};

export default SearchBar;
