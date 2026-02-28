import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalCount: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalCount, pageSize, onPageChange }) => {
    const totalPages = Math.ceil(totalCount / pageSize);

    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);

    const getPageNumbers = (): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [1];

        if (currentPage > 3) pages.push('ellipsis-start');

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);

        if (currentPage < totalPages - 2) pages.push('ellipsis-end');

        pages.push(totalPages);
        return pages;
    };

    const pages = getPageNumbers();

    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        .pg-root {
            font-family: 'DM Sans', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
            padding: 20px 0;
        }

        .pg-info {
            font-size: 13px;
            font-weight: 500;
            color: #64748b;
            letter-spacing: 0.01em;
        }

        .pg-info strong {
            color: #1e293b;
            font-weight: 700;
        }

        .pg-nav {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .pg-btn {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 38px;
            min-width: 38px;
            padding: 0 4px;
            border: 1.5px solid #e2e8f0;
            border-radius: 9px;
            background: #ffffff;
            color: #374151;
            font-family: 'DM Sans', sans-serif;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            outline: none;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }

        .pg-btn:hover:not(:disabled):not(.pg-btn--active) {
            border-color: #818cf8;
            background: #eef2ff;
            color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
        }

        .pg-btn--active {
            background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
            border-color: transparent;
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(99,102,241,0.4);
            transform: scale(1.07);
            cursor: default;
        }

        /* Disabled: visible but clearly inactive — slate background, washed-out icon */
        .pg-btn:disabled {
            cursor: not-allowed;
            background: #f1f5f9;
            border-color: #e2e8f0;
            color: #b3c0d0;
            box-shadow: none;
            transform: none;
        }

        .pg-ellipsis {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 38px;
            width: 28px;
            color: #94a3b8;
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0.08em;
            user-select: none;
        }

        .pg-divider {
            width: 1px;
            height: 22px;
            background: #e2e8f0;
            margin: 0 3px;
        }

        @media (max-width: 480px) {
            .pg-btn--extreme { display: none; }
            .pg-divider { display: none; }
        }
    `;

    return (
        <>
            <style>{styles}</style>
            <div className="pg-root">
                <p className="pg-info">
                    Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalCount}</strong> results
                </p>

                <nav className="pg-nav" aria-label="Pagination">
                    <button
                        className="pg-btn pg-btn--extreme"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        aria-label="First page"
                        title="First page"
                    >
                        <ChevronsLeft size={15} />
                    </button>

                    <button
                        className="pg-btn"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                        title="Previous page"
                    >
                        <ChevronLeft size={15} />
                    </button>

                    <div className="pg-divider" />

                    {pages.map((page) => {
                        if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                            return <span key={page} className="pg-ellipsis">···</span>;
                        }
                        return (
                            <button
                                key={page}
                                className={`pg-btn${currentPage === page ? ' pg-btn--active' : ''}`}
                                onClick={() => onPageChange(page)}
                                aria-current={currentPage === page ? 'page' : undefined}
                                aria-label={`Page ${page}`}
                            >
                                {page}
                            </button>
                        );
                    })}

                    <div className="pg-divider" />

                    <button
                        className="pg-btn"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                        title="Next page"
                    >
                        <ChevronRight size={15} />
                    </button>

                    <button
                        className="pg-btn pg-btn--extreme"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        aria-label="Last page"
                        title="Last page"
                    >
                        <ChevronsRight size={15} />
                    </button>
                </nav>
            </div>
        </>
    );
};

export default Pagination;