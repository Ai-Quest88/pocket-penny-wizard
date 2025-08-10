import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryGroupCard } from "./CategoryGroupCard";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, GripVertical, ChevronDown, ChevronRight, Settings, Folder, FolderOpen } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface CategoryBucket {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  categories: Category[];
  groupId: string; // Which high-level group this bucket belongs to
}

export interface CategoryGroup {
  id: string;
  name: string;
  type: 'Income' | 'Expense' | 'Assets' | 'Liability' | 'Transfers' | 'Adjustments';
  description?: string;
  color: string;
  icon?: string;
  buckets: CategoryBucket[];
}

const defaultCategoryGroups: CategoryGroup[] = [
  {
    id: "income",
    name: "Income",
    type: "Income",
    description: "Money coming in",
    color: "bg-green-50 border-green-200",
    icon: "💰",
    buckets: [
      {
        id: "primary-income",
        name: "Primary Income",
        description: "Main sources of income",
        color: "bg-green-100 border-green-300",
        icon: "💼",
        groupId: "income",
        categories: [
          { id: "salary", name: "Salary", description: "Regular employment income" },
          { id: "wages", name: "Wages", description: "Hourly or part-time work" },
          { id: "bonuses", name: "Bonuses", description: "Performance bonuses" },
          { id: "commission", name: "Commission", description: "Sales commissions" },
          { id: "overtime", name: "Overtime", description: "Overtime pay" }
        ]
      },
      {
        id: "business-income",
        name: "Business Income",
        description: "Self-employment and business revenue",
        color: "bg-green-100 border-green-300",
        icon: "🏢",
        groupId: "income",
        categories: [
          { id: "freelance", name: "Freelance", description: "Freelance work" },
          { id: "consulting", name: "Consulting", description: "Consulting services" },
          { id: "side-hustles", name: "Side Hustles", description: "Part-time business activities" },
          { id: "business-revenue", name: "Business Revenue", description: "Business sales" }
        ]
      },
      {
        id: "investment-income",
        name: "Investment Income",
        description: "Returns from investments",
        color: "bg-green-100 border-green-300",
        icon: "📈",
        groupId: "income",
        categories: [
          { id: "dividends", name: "Dividends", description: "Stock dividends" },
          { id: "interest", name: "Interest", description: "Interest income" },
          { id: "capital-gains", name: "Capital Gains", description: "Investment profits" },
          { id: "rental-income", name: "Rental Income", description: "Property rental income" }
        ]
      },
      {
        id: "other-income",
        name: "Other Income",
        description: "Miscellaneous income sources",
        color: "bg-green-100 border-green-300",
        icon: "🎁",
        groupId: "income",
    categories: [
          { id: "gifts", name: "Gifts", description: "Monetary gifts" },
          { id: "refunds", name: "Refunds", description: "Purchase refunds" },
          { id: "tax-returns", name: "Tax Returns", description: "Tax refunds" },
          { id: "alimony", name: "Alimony", description: "Alimony payments" },
          { id: "child-support", name: "Child Support", description: "Child support payments" },
          { id: "government-benefits", name: "Government Benefits", description: "Social security, etc." }
        ]
      }
    ]
  },
  {
    id: "expenses",
    name: "Expenses",
    type: "Expense", 
    description: "Money going out",
    color: "bg-red-50 border-red-200",
    icon: "💸",
    buckets: [
      {
        id: "housing",
        name: "Housing",
        description: "Home-related expenses",
        color: "bg-red-100 border-red-300",
        icon: "🏠",
        groupId: "expenses",
        categories: [
          { id: "rent", name: "Rent", description: "Monthly rent payments" },
          { id: "mortgage", name: "Mortgage", description: "Home loan payments" },
          { id: "utilities", name: "Utilities", description: "Electricity, water, gas" },
          { id: "home-insurance", name: "Home Insurance", description: "Property insurance" },
          { id: "maintenance", name: "Maintenance", description: "Home repairs and upkeep" },
          { id: "furniture", name: "Furniture", description: "Home furnishings" }
        ]
      },
      {
        id: "transportation",
        name: "Transportation",
        description: "Getting around",
        color: "bg-red-100 border-red-300",
        icon: "🚗",
        groupId: "expenses",
        categories: [
          { id: "car-payment", name: "Car Payment", description: "Vehicle loan payments" },
          { id: "gas", name: "Gas", description: "Fuel costs" },
          { id: "car-insurance", name: "Car Insurance", description: "Vehicle insurance" },
          { id: "maintenance", name: "Maintenance", description: "Car repairs and service" },
          { id: "public-transit", name: "Public Transit", description: "Buses, trains, subways" },
          { id: "uber-lyft", name: "Uber/Lyft", description: "Ride-sharing services" }
        ]
      },
      {
        id: "food-dining",
        name: "Food & Dining",
        description: "All food-related expenses",
        color: "bg-red-100 border-red-300",
        icon: "🍽️",
        groupId: "expenses",
        categories: [
          { id: "groceries", name: "Groceries", description: "Food from grocery stores" },
          { id: "restaurants", name: "Restaurants", description: "Dining out at restaurants" },
          { id: "fast-food", name: "Fast Food", description: "Quick service restaurants" },
          { id: "coffee-shops", name: "Coffee Shops", description: "Coffee and cafes" },
          { id: "food-delivery", name: "Food Delivery", description: "Delivery services" },
          { id: "alcohol", name: "Alcohol", description: "Beverages and bars" }
        ]
      },
      {
        id: "healthcare",
        name: "Healthcare",
        description: "Health and wellness expenses",
        color: "bg-red-100 border-red-300",
        icon: "🏥",
        groupId: "expenses",
        categories: [
          { id: "medical-insurance", name: "Medical Insurance", description: "Health insurance premiums" },
          { id: "doctor-visits", name: "Doctor Visits", description: "Medical appointments" },
          { id: "dental", name: "Dental", description: "Dental care" },
          { id: "prescriptions", name: "Prescriptions", description: "Medications" },
          { id: "gym", name: "Gym", description: "Fitness memberships" },
          { id: "wellness", name: "Wellness", description: "Alternative health care" }
        ]
      },
      {
        id: "entertainment",
        name: "Entertainment",
        description: "Fun and leisure activities",
        color: "bg-red-100 border-red-300",
        icon: "🎬",
        groupId: "expenses",
        categories: [
          { id: "movies", name: "Movies", description: "Movie theaters and rentals" },
          { id: "concerts", name: "Concerts", description: "Live music and events" },
          { id: "gaming", name: "Gaming", description: "Video games and gaming" },
          { id: "streaming-services", name: "Streaming Services", description: "Netflix, Hulu, etc." },
          { id: "books", name: "Books", description: "Books and reading materials" },
          { id: "hobbies", name: "Hobbies", description: "Recreational activities" }
        ]
      },
      {
        id: "shopping",
        name: "Shopping",
        description: "Retail purchases",
        color: "bg-red-100 border-red-300",
        icon: "🛍️",
        groupId: "expenses",
        categories: [
          { id: "clothing", name: "Clothing", description: "Apparel and accessories" },
          { id: "electronics", name: "Electronics", description: "Tech and gadgets" },
          { id: "home-goods", name: "Home Goods", description: "Household items" },
          { id: "personal-care", name: "Personal Care", description: "Beauty and hygiene" },
          { id: "beauty", name: "Beauty", description: "Cosmetics and beauty products" }
        ]
      },
      {
        id: "travel",
        name: "Travel",
        description: "Vacations and business travel",
        color: "bg-red-100 border-red-300",
        icon: "✈️",
        groupId: "expenses",
        categories: [
          { id: "vacations", name: "Vacations", description: "Personal travel" },
          { id: "business-travel", name: "Business Travel", description: "Work-related travel" },
          { id: "hotels", name: "Hotels", description: "Accommodation" },
          { id: "flights", name: "Flights", description: "Air travel" },
          { id: "car-rentals", name: "Car Rentals", description: "Rental vehicles" }
        ]
      },
      {
        id: "education",
        name: "Education",
        description: "Learning and development",
        color: "bg-red-100 border-red-300",
        icon: "🎓",
        groupId: "expenses",
    categories: [
          { id: "tuition", name: "Tuition", description: "School and college fees" },
          { id: "books", name: "Books", description: "Educational materials" },
          { id: "courses", name: "Courses", description: "Online and offline courses" },
          { id: "student-loans", name: "Student Loans", description: "Education loan payments" },
          { id: "school-supplies", name: "School Supplies", description: "Educational supplies" }
        ]
      },
      {
        id: "insurance",
        name: "Insurance",
        description: "Insurance premiums",
        color: "bg-red-100 border-red-300",
        icon: "🛡️",
        groupId: "expenses",
        categories: [
          { id: "life-insurance", name: "Life Insurance", description: "Life insurance premiums" },
          { id: "health-insurance", name: "Health Insurance", description: "Health insurance" },
          { id: "car-insurance", name: "Car Insurance", description: "Vehicle insurance" },
          { id: "home-insurance", name: "Home Insurance", description: "Property insurance" }
        ]
      },
      {
        id: "taxes",
        name: "Taxes",
        description: "Tax payments",
        color: "bg-red-100 border-red-300",
        icon: "📊",
        groupId: "expenses",
        categories: [
          { id: "income-tax", name: "Income Tax", description: "Income tax payments" },
          { id: "property-tax", name: "Property Tax", description: "Property taxes" },
          { id: "sales-tax", name: "Sales Tax", description: "Sales and use taxes" },
          { id: "other-taxes", name: "Other Taxes", description: "Other tax obligations" }
        ]
      }
    ]
  },
  {
    id: "assets",
    name: "Assets",
    type: "Assets",
    description: "Things you own",
    color: "bg-blue-50 border-blue-200",
    icon: "💎",
    buckets: [
      {
        id: "cash-bank",
        name: "Cash & Bank",
        description: "Liquid assets",
        color: "bg-blue-100 border-blue-300",
        icon: "💵",
        groupId: "assets",
        categories: [
          { id: "checking", name: "Checking", description: "Checking accounts" },
          { id: "savings", name: "Savings", description: "Savings accounts" },
          { id: "money-market", name: "Money Market", description: "Money market accounts" },
          { id: "emergency-fund", name: "Emergency Fund", description: "Emergency savings" }
        ]
      },
      {
        id: "shares-etfs",
        name: "Shares & ETFs",
        description: "Shares and exchange traded funds",
        color: "bg-blue-100 border-blue-300",
        icon: "📈",
        groupId: "assets",
        categories: [
          { id: "asx-shares", name: "ASX Shares", description: "Australian stock exchange shares" },
          { id: "international-shares", name: "International Shares", description: "International stock investments" },
          { id: "etfs", name: "ETFs", description: "Exchange traded funds" },
          { id: "managed-funds", name: "Managed Funds", description: "Professionally managed funds" },
          { id: "index-funds", name: "Index Funds", description: "Index tracking funds" }
        ]
      },
      {
        id: "superannuation",
        name: "Superannuation",
        description: "Australian retirement savings",
        color: "bg-blue-100 border-blue-300",
        icon: "🏦",
        groupId: "assets",
        categories: [
          { id: "employer-super", name: "Employer Super", description: "Employer contributions" },
          { id: "salary-sacrifice", name: "Salary Sacrifice", description: "Pre-tax contributions" },
          { id: "personal-contributions", name: "Personal Contributions", description: "After-tax contributions" },
          { id: "government-co-contribution", name: "Government Co-contribution", description: "Government matching" },
          { id: "smsf", name: "SMSF", description: "Self-managed super fund" }
        ]
      },
      {
        id: "cryptocurrency",
        name: "Cryptocurrency",
        description: "Digital currencies",
        color: "bg-blue-100 border-blue-300",
        icon: "₿",
        groupId: "assets",
        categories: [
          { id: "bitcoin", name: "Bitcoin", description: "Bitcoin holdings" },
          { id: "ethereum", name: "Ethereum", description: "Ethereum holdings" },
          { id: "altcoins", name: "Altcoins", description: "Alternative cryptocurrencies" },
          { id: "stablecoins", name: "Stablecoins", description: "Stable value cryptocurrencies" }
        ]
      },
      {
        id: "alternative-investments",
        name: "Alternative Investments",
        description: "Non-traditional investments",
        color: "bg-blue-100 border-blue-300",
        icon: "💰",
        groupId: "assets",
        categories: [
          { id: "investment-property", name: "Investment Property", description: "Rental property investments" },
          { id: "reits", name: "REITs", description: "Real estate investment trusts" },
          { id: "commodities", name: "Commodities", description: "Physical commodities" },
          { id: "bonds", name: "Bonds", description: "Government and corporate bonds" },
          { id: "term-deposits", name: "Term Deposits", description: "Fixed term deposits" }
        ]
      },
      {
        id: "real-estate",
        name: "Real Estate",
        description: "Property investments",
        color: "bg-blue-100 border-blue-300",
        icon: "🏘️",
        groupId: "assets",
        categories: [
          { id: "primary-home", name: "Primary Home", description: "Main residence" },
          { id: "investment-properties", name: "Investment Properties", description: "Rental properties" },
          { id: "land", name: "Land", description: "Vacant land" }
        ]
      },
      {
        id: "vehicles",
        name: "Vehicles",
        description: "Transportation assets",
        color: "bg-blue-100 border-blue-300",
        icon: "🚗",
        groupId: "assets",
        categories: [
          { id: "cars", name: "Cars", description: "Automobiles" },
          { id: "motorcycles", name: "Motorcycles", description: "Motorcycles and bikes" },
          { id: "boats", name: "Boats", description: "Watercraft" },
          { id: "rvs", name: "RVs", description: "Recreational vehicles" }
        ]
      },
      {
        id: "personal-assets",
        name: "Personal Assets",
        description: "Personal property",
        color: "bg-blue-100 border-blue-300",
        icon: "💍",
        groupId: "assets",
        categories: [
          { id: "jewelry", name: "Jewelry", description: "Precious jewelry" },
          { id: "art", name: "Art", description: "Artwork and collectibles" },
          { id: "collectibles", name: "Collectibles", description: "Collectible items" },
          { id: "electronics", name: "Electronics", description: "Personal electronics" }
        ]
      }
    ]
  },
  {
    id: "liabilities",
    name: "Liabilities",
    type: "Liability",
    description: "Money you owe",
    color: "bg-orange-50 border-orange-200",
    icon: "💳",
    buckets: [
      {
        id: "credit-cards",
        name: "Credit Cards",
        description: "Credit card debt",
        color: "bg-orange-100 border-orange-300",
        icon: "💳",
        groupId: "liabilities",
        categories: [
          { id: "personal-cards", name: "Personal Cards", description: "Personal credit cards" },
          { id: "business-cards", name: "Business Cards", description: "Business credit cards" },
          { id: "store-cards", name: "Store Cards", description: "Store-specific cards" }
        ]
      },
      {
        id: "loans",
        name: "Loans",
        description: "Personal and business loans",
        color: "bg-orange-100 border-orange-300",
        icon: "📋",
        groupId: "liabilities",
        categories: [
          { id: "personal-loans", name: "Personal Loans", description: "Personal loan debt" },
          { id: "student-loans", name: "Student Loans", description: "Education loan debt" },
          { id: "business-loans", name: "Business Loans", description: "Business loan debt" }
        ]
      },
      {
        id: "mortgage",
        name: "Mortgage",
        description: "Property loans",
        color: "bg-orange-100 border-orange-300",
        icon: "🏠",
        groupId: "liabilities",
        categories: [
          { id: "primary-mortgage", name: "Primary Mortgage", description: "Main home mortgage" },
          { id: "investment-mortgages", name: "Investment Mortgages", description: "Investment property loans" }
        ]
      },
      {
        id: "other-debt",
        name: "Other Debt",
        description: "Other debt obligations",
        color: "bg-orange-100 border-orange-300",
        icon: "📄",
        groupId: "liabilities",
        categories: [
          { id: "medical-bills", name: "Medical Bills", description: "Medical debt" },
          { id: "tax-debt", name: "Tax Debt", description: "Tax obligations" },
          { id: "legal-fees", name: "Legal Fees", description: "Legal debt" }
        ]
      }
    ]
  },
  {
    id: "transfers",
    name: "Transfers",
    type: "Transfers",
    description: "Internal money movements",
    color: "bg-purple-50 border-purple-200",
    icon: "🔄",
    buckets: [
      {
        id: "transfers-internal",
        name: "Transfers",
        description: "Internal account-to-account",
        color: "bg-purple-100 border-purple-300",
        icon: "🔄",
        groupId: "transfers",
        categories: [
          { id: "internal-transfer", name: "Internal Transfer", description: "Ignore in cashflow and income/expense reports" }
        ]
      }
    ]
  },
];

export const CategoryManager = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addBucketDialogOpen, setAddBucketDialogOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [collapsedBuckets, setCollapsedBuckets] = useState<Set<string>>(new Set());

  // Supabase helpers for per-user categories
  const groupMeta = {
    income: defaultCategoryGroups.find(g => g.id === 'income'),
    expenses: defaultCategoryGroups.find(g => g.id === 'expenses'),
    assets: defaultCategoryGroups.find(g => g.id === 'assets'),
    liabilities: defaultCategoryGroups.find(g => g.id === 'liabilities'),
    transfers: defaultCategoryGroups.find(g => g.id === 'transfers'),
  };

  const loadFromSupabase = async (): Promise<CategoryGroup[]> => {
    console.log('CategoryManager: loadFromSupabase called, user ID:', session?.user?.id);
    if (!session?.user?.id) {
      console.log('CategoryManager: No user session, loading from localStorage');
      const stored = localStorage.getItem('categoryGroups');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Ensure the Adjustments group is removed if it exists in persisted data
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter((g: any) => g?.id !== 'adjustments' && g?.type !== 'Adjustments');
          }
        } catch (e) {
          console.warn('Failed to parse categoryGroups from localStorage:', e);
        }
      }
      // Fallback to defaults if nothing stored or stored is empty; also ensure Adjustments are excluded
      return defaultCategoryGroups.filter((g) => g.id !== 'adjustments' && g.type !== 'Adjustments');
    }
    
    console.log('CategoryManager: Authenticated user, seeding defaults');
    // Ensure defaults for user
    await supabase.rpc('seed_default_categories');

    const { data: groups } = await supabase
      .from('category_groups')
      .select('id,key,name,sort_order')
      .order('sort_order', { ascending: true });

    console.log('CategoryManager: Groups fetched:', groups);

    const { data: bucketsRaw } = await supabase
      .from('category_buckets')
      .select('id,name,group_id,sort_order')
      .eq('user_id', session.user.id)
      .order('sort_order', { ascending: true });

    console.log('CategoryManager: Buckets fetched:', bucketsRaw);
    
    // Log groups for debugging
    console.log('CategoryManager: Groups fetched:', groups);

    const { data: catsRaw } = await supabase
      .from('categories')
      .select('id,name,bucket_id,is_transfer,sort_order')
      .eq('user_id', session.user.id)
      .order('sort_order', { ascending: true });

    console.log('CategoryManager: Categories fetched:', catsRaw);

    let buckets = bucketsRaw || [];
    let cats = catsRaw || [];

    if (buckets.length === 0 && cats.length === 0) {
      await supabase.rpc('seed_default_categories');
      const { data: b2 } = await supabase
        .from('category_buckets')
        .select('id,name,group_id,sort_order')
        .eq('user_id', session.user.id)
        .order('sort_order', { ascending: true });
      const { data: c2 } = await supabase
        .from('categories')
        .select('id,name,bucket_id,is_transfer,sort_order')
        .eq('user_id', session.user.id)
        .order('sort_order', { ascending: true });
      buckets = b2 || [];
      cats = c2 || [];
    }

    const groupIdByKey = new Map<string, string>();
    (groups || []).forEach(g => { if ((g as any).key) groupIdByKey.set((g as any).key, (g as any).id); });

    const bucketsByGroupKey = new Map<string, any[]>();
    (buckets || []).forEach((b: any) => {
      const groupKey = [...groupIdByKey.entries()].find(([, id]) => id === b.group_id)?.[0];
      if (!groupKey) return;
      const arr = bucketsByGroupKey.get(groupKey) || [];
      arr.push(b);
      bucketsByGroupKey.set(groupKey, arr);
    });

    const catsByBucket = new Map<string, any[]>();
    (cats || []).forEach((c: any) => {
      const arr = catsByBucket.get(c.bucket_id) || [];
      arr.push(c);
      catsByBucket.set(c.bucket_id, arr);
    });

    const buildGroup = (key: string, meta: any): CategoryGroup => {
      const groupBuckets = (bucketsByGroupKey.get(key) || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        description: undefined,
        color: meta?.buckets?.[0]?.color || 'bg-muted',
        icon: meta?.icon || '📁',
        groupId: key,
        categories: (catsByBucket.get(b.id) || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          description: undefined,
        })),
      }));
      return {
        id: key,
        name: meta?.name || key,
        type: (meta?.type as any) || 'Expense',
        description: meta?.description,
        color: meta?.color || 'bg-muted',
        icon: meta?.icon || '📁',
        buckets: groupBuckets,
      } as CategoryGroup;
    };

    return [
      buildGroup('income', groupMeta.income),
      buildGroup('expenses', groupMeta.expenses),
      buildGroup('assets', groupMeta.assets),
      buildGroup('liabilities', groupMeta.liabilities),
      buildGroup('transfers', groupMeta.transfers),
    ];
  };

  const syncToSupabase = async (groups: CategoryGroup[]) => {
    if (!session?.user?.id) return;
    // Map group key -> id
    const { data: groupsRows } = await supabase.from('category_groups').select('id,key');
    const groupMap = new Map<string, string>();
    (groupsRows || []).forEach((g: any) => groupMap.set(g.key, g.id));

    // Upsert buckets and categories
    for (const g of groups) {
      const groupId = groupMap.get(g.id);
      if (!groupId) continue;
      for (const b of g.buckets || []) {
        // Try to find existing by name and group
        const { data: existingBuckets } = await supabase
          .from('category_buckets')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('group_id', groupId)
          .eq('name', b.name)
          .limit(1);
        let bucketId = existingBuckets && existingBuckets[0]?.id;
        if (!bucketId) {
          const { data: inserted, error: ibErr } = await supabase
            .from('category_buckets')
            .insert([{ user_id: session.user.id, group_id: groupId, name: b.name }])
            .select('id')
            .single();
          if (ibErr) {
            console.warn('Bucket upsert error', ibErr);
            continue;
          }
          bucketId = inserted?.id;
        }
        // Upsert categories
        for (const c of b.categories || []) {
          const { data: existingCat } = await supabase
            .from('categories')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('bucket_id', bucketId)
            .eq('name', c.name)
            .limit(1);
          if (!existingCat || existingCat.length === 0) {
            await supabase.from('categories').insert([{ user_id: session.user.id, bucket_id: bucketId, name: c.name }]);
          }
        }
      }
    }
  };

  // Fetch category groups (Supabase when authenticated, else localStorage/defaults)
  const { data: categoryGroups = defaultCategoryGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ['category-groups', session?.user?.id],
    queryFn: loadFromSupabase,
    enabled: true,
  });

  // Save category groups mutation
  const saveCategoryGroups = useMutation({
    mutationFn: async (groups: CategoryGroup[]) => {
      localStorage.setItem('categoryGroups', JSON.stringify(groups));
      await syncToSupabase(groups);
      return groups;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-groups'] });
      toast({
        title: "Categories Updated",
        description: "Category structure has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update category structure.",
        variant: "destructive",
      });
    },
  });

  const handleAddCategory = (category: Omit<Category, 'id'>, bucketId: string) => {
    const newCategory: Category = {
      ...category,
      id: `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const newGroups = categoryGroups?.map(group => ({
        ...group,
      buckets: group.buckets?.map(bucket => 
        bucket.id === bucketId 
          ? { ...bucket, categories: [...(bucket.categories || []), newCategory] }
          : bucket
      ) || []
    })) || [];

      saveCategoryGroups.mutate(newGroups);
  };

  const handleRemoveCategory = (categoryId: string, bucketId: string) => {
    const newGroups = categoryGroups?.map(group => ({
      ...group,
      buckets: group.buckets?.map(bucket => 
        bucket.id === bucketId 
          ? { ...bucket, categories: (bucket.categories || []).filter(c => c.id !== categoryId) }
          : bucket
      ) || []
    })) || [];

    saveCategoryGroups.mutate(newGroups);
  };

  const handleMoveCategory = (categoryId: string, fromBucketId: string, toBucketId: string) => {
    if (fromBucketId === toBucketId) return;

    let categoryToMove: Category | undefined;
    const newGroups = categoryGroups?.map(group => ({
      ...group,
      buckets: group.buckets?.map(bucket => {
        if (bucket.id === fromBucketId) {
          categoryToMove = (bucket.categories || []).find(c => c.id === categoryId);
          return {
            ...bucket,
            categories: (bucket.categories || []).filter(c => c.id !== categoryId)
          };
        }
        return bucket;
      }) || []
    })) || [];

    if (categoryToMove) {
      newGroups.forEach(group => {
        group.buckets = (group.buckets || []).map(bucket => {
          if (bucket.id === toBucketId) {
            return { ...bucket, categories: [ ...(bucket.categories || []), categoryToMove! ] };
          }
          return bucket;
        });
      });
    }
    
    saveCategoryGroups.mutate(newGroups);
  };

  const handleAddBucket = (bucket: Omit<CategoryBucket, 'id'>, groupId: string) => {
    const newBucket: CategoryBucket = {
      ...bucket,
      id: `bucket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      categories: []
    };

    const newGroups = categoryGroups?.map(group => 
      group.id === groupId 
        ? { ...group, buckets: [...(group.buckets || []), newBucket] }
        : group
    ) || [];

    saveCategoryGroups.mutate(newGroups);
    setAddBucketDialogOpen(false);
  };

  const toggleGroupCollapse = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const toggleBucketCollapse = (bucketId: string) => {
    const newCollapsed = new Set(collapsedBuckets);
    if (newCollapsed.has(bucketId)) {
      newCollapsed.delete(bucketId);
    } else {
      newCollapsed.add(bucketId);
    }
    setCollapsedBuckets(newCollapsed);
  };

  const expandAllGroups = () => {
    setCollapsedGroups(new Set());
    setCollapsedBuckets(new Set());
  };

  const collapseAllGroups = () => {
    const allGroupIds = categoryGroups?.map(g => g.id) || [];
    const allBucketIds = categoryGroups?.flatMap(g => (g.buckets || []).map(b => b.id)) || [];
    setCollapsedGroups(new Set(allGroupIds));
    setCollapsedBuckets(new Set(allBucketIds));
  };

  const resetCategories = async () => {
    try {
      localStorage.removeItem('categoryGroups');
      if (session?.user?.id) {
        await supabase.from('categories').delete().eq('user_id', session.user.id);
        await supabase.from('category_buckets').delete().eq('user_id', session.user.id);
        await supabase.rpc('seed_default_categories');
      }
      queryClient.invalidateQueries({ queryKey: ['category-groups', session?.user?.id] });
      setCollapsedGroups(new Set());
      setCollapsedBuckets(new Set());
      toast({ title: 'Categories Reset', description: 'Restored default categories.' });
    } catch (e) {
      toast({ title: 'Reset Failed', description: 'Could not reset categories.', variant: 'destructive' });
    }
  };

  if (groupsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <GripVertical className="h-4 w-4" />
            Organize categories into groups and buckets
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <GripVertical className="h-4 w-4" />
          Organize categories into groups and buckets
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAllGroups}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAllGroups}>
            Collapse All
          </Button>
          <Button variant="outline" size="sm" onClick={resetCategories}>
            Reset Categories
          </Button>
          <Dialog open={addBucketDialogOpen} onOpenChange={setAddBucketDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Folder className="h-4 w-4 mr-2" />
                Add Bucket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category Bucket</DialogTitle>
              </DialogHeader>
              <AddBucketForm onAddBucket={handleAddBucket} categoryGroups={categoryGroups} />
            </DialogContent>
          </Dialog>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Category Groups */}
        {categoryGroups?.map((group) => (
        <Collapsible 
          key={group.id}
          open={!collapsedGroups.has(group.id)} 
          onOpenChange={() => toggleGroupCollapse(group.id)}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className={`w-full justify-between p-4 h-auto ${group.color}`}>
              <div className="flex items-center gap-3">
                {collapsedGroups.has(group.id) ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                <span className="text-2xl">{group.icon}</span>
                <div className="text-left">
                  <h3 className="text-lg font-semibold">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                </div>
              </div>
              <Badge variant="secondary">
                {(group.buckets?.length ?? 0)} buckets • {(group.buckets?.reduce((sum, b) => sum + (b.categories?.length ?? 0), 0) ?? 0)} categories
              </Badge>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-8 mt-4 space-y-4">
              {(group.buckets ?? []).map((bucket, index) => (
                <div key={bucket.id} className="relative">
                  {/* Connection line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted-foreground/30" />
                  
                  {/* Connection dot */}
                  <div className="absolute left-3.5 top-6 w-1 h-1 bg-muted-foreground/50 rounded-full" />
                  
          <CategoryGroupCard
                    bucket={bucket}
            onRemoveCategory={handleRemoveCategory}
            onMoveCategory={handleMoveCategory}
                    isCollapsed={collapsedBuckets.has(bucket.id)}
                    onToggleCollapse={() => toggleBucketCollapse(bucket.id)}
          />
                </div>
        ))}
      </div>
          </CollapsibleContent>
        </Collapsible>
      ))}

      <AddCategoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAddCategory={handleAddCategory}
        categoryGroups={categoryGroups ?? defaultCategoryGroups}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Impact Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-600">Net Worth Impact:</span>
                <span>Income - Expenses</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-600">Cash Flow:</span>
                <span>All categories including Transfers</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Investment Activity:</span>
                <span>Separate from regular income/expenses</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Groups:</strong> High-level financial categories (Income, Expenses, Assets, etc.)</p>
              <p><strong>Buckets:</strong> Logical groupings within each financial area</p>
              <p><strong>Categories:</strong> Specific transaction types</p>
              <p><strong>Drag & Drop:</strong> Move categories between buckets</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Add Bucket Form Component
const AddBucketForm = ({ 
  onAddBucket, 
  categoryGroups 
}: { 
  onAddBucket: (bucket: Omit<CategoryBucket, 'id'>, groupId: string) => void;
  categoryGroups: CategoryGroup[];
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📁');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedGroupId) return;
    
    onAddBucket({
      name: name.trim(),
      description: description.trim() || undefined,
      color: "bg-blue-100 border-blue-300",
      icon: icon,
      categories: [],
      groupId: selectedGroupId
    }, selectedGroupId);
    
    setName('');
    setDescription('');
    setIcon('📁');
    setSelectedGroupId('');
  };

  const iconOptions = ['💰', '🏠', '📈', '💳', '⚙️', '📁', '🎯', '🚀', '💎', '🌱', '🍽️', '🚗', '🏥', '🎬', '🛍️', '✈️', '🎓', '🛡️', '📊'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bucket-group">Group</Label>
        <select
          id="bucket-group"
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="w-full p-2 border rounded-md"
          required
        >
          <option value="">Select a group</option>
          {categoryGroups?.map((group) => (
            <option key={group.id} value={group.id}>
              {group.icon} {group.name}
            </option>
          )) || []}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bucket-name">Bucket Name</Label>
        <Input
          id="bucket-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Entertainment"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bucket-description">Description (Optional)</Label>
        <Input
          id="bucket-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Fun and leisure activities"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex gap-2 flex-wrap">
          {iconOptions.map((iconOption) => (
            <Button
              key={iconOption}
              type="button"
              variant={icon === iconOption ? "default" : "outline"}
              size="sm"
              onClick={() => setIcon(iconOption)}
              className="text-lg"
            >
              {iconOption}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="submit">Create Bucket</Button>
      </div>
    </form>
  );
};