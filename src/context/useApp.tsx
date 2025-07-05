import { useContext } from "react";
import { AppContext } from "./AppContext"; // Adjust the path as needed

  export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
      throw new Error('useApp must be used within an AppProvider');
    }
    return context;
  }