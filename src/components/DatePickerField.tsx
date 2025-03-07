import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from 'lucide-react';
import { Button } from './ui/button';

interface DatePickerFieldProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

const CustomInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
  ({ value, onClick }, ref) => (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      ref={ref}
      className="w-full justify-start text-left font-normal"
    >
      <Calendar className="mr-2 h-4 w-4" />
      {value || "Select date"}
    </Button>
  )
);
CustomInput.displayName = "CustomInput";

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  selected,
  onChange,
  placeholder = "Select date"
}) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      customInput={<CustomInput />}
      dateFormat="MMM d, yyyy"
      placeholderText={placeholder}
      showPopperArrow={false}
      className="w-full"
    />
  );
};