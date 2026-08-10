import { supabase } from "./lib/db"

async function testDelete() {
  if (!supabase) return console.log("No supabase");
  
  // Try to find a report
  const { data: reports } = await supabase.from("reports").select("id").limit(1);
  if (!reports || reports.length === 0) {
    console.log("No reports in supabase");
    return;
  }
  
  const id = reports[0].id;
  console.log("Found report", id, "Attempting to update is_archived...");
  
  const { data, error } = await supabase.from("reports").update({ is_archived: true }).eq("id", id).select();
  
  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Success:", data);
  }
}

testDelete();
