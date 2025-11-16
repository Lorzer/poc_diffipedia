import React from 'react';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { SearchPage } from './pages/SearchPage';
import { ListPage } from './pages/ListPage';

const App: React.FC = () => {
    return (
        <Router>
            <div className="bg-gray-900 text-white min-h-screen font-sans">
                <nav className="bg-gray-800 border-b border-gray-700">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 text-xl font-bold">
                                    Grok Comparator
                                </div>
                                <div className="hidden md:block">
                                    <div className="ml-10 flex items-baseline space-x-4">
                                        <NavLink 
                                            to="/" 
                                            className={({ isActive }) => 
                                                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
                                            }
                                        >
                                            Search
                                        </NavLink>
                                        <NavLink 
                                            to="/history" 
                                            className={({ isActive }) => 
                                                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
                                            }
                                        >
                                            History
                                        </NavLink>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
                <main>
                    <Routes>
                        <Route path="/" element={<SearchPage />} />
                        <Route path="/history" element={<ListPage />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App;
