import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full overflow-x-auto border border-line rounded-container bg-surface">
      <table className={`w-full text-left text-sm border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <thead className={`bg-paper/80 border-b border-line sticky top-0 z-10 ${className}`} {...props}>
      {children}
    </thead>
  );
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tr
      className={`border-b border-line last:border-b-0 hover:bg-paper/40 transition-colors duration-75 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableHeader: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  align = 'left',
  ...props
}) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <th
      className={`px-4 py-2.5 text-xs font-medium text-muted tracking-normal ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  align = 'left',
  ...props
}) => {
  const alignClass = align === 'right' ? 'text-right tabular-nums' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <td
      className={`px-4 py-3 text-sm text-ink ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
};
