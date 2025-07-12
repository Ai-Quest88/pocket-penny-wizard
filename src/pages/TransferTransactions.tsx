import { TransactionList } from "@/components/TransactionList";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const TransferTransactions = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Transfers</h1>
          <p className="text-muted-foreground">Review all transactions categorized as transfers</p>
        </header>

        {/* Show only transactions categorized as "Transfer" */}
        <TransactionList categoryFilter="Transfer" />
      </div>
    </div>
  );
};

export default TransferTransactions;