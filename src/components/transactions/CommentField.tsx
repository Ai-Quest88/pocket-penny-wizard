
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

interface CommentFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
}

export const CommentField = <T extends FieldValues>({ control, name }: CommentFieldProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Comment (Optional)</FormLabel>
          <FormControl>
            <Textarea 
              placeholder="Add a comment about this transaction..."
              className="min-h-[80px]"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
