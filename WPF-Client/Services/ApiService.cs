using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ComputerShopClient.Services
{
    public class ApiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;
        private readonly string _pcId;

        public ApiService(string baseUrl, string pcId)
        {
            _baseUrl = baseUrl;
            _pcId = pcId;
            _httpClient = new HttpClient
            {
                BaseAddress = new Uri(baseUrl)
            };
        }

        public async Task SendStatusUpdate(PcStatusDto status)
        {
            try
            {
                var json = JsonSerializer.Serialize(status);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                var response = await _httpClient.PostAsync("/api/pc-status", content);
                response.EnsureSuccessStatusCode();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending status: {ex.Message}");
            }
        }

        public async Task<CommandDto[]> GetPendingCommands()
        {
            try
            {
                var response = await _httpClient.GetAsync($"/api/pc-control?pcId={_pcId}");
                response.EnsureSuccessStatusCode();
                
                var json = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<CommandResponse>(json);
                
                return result?.Commands ?? Array.Empty<CommandDto>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching commands: {ex.Message}");
                return Array.Empty<CommandDto>();
            }
        }
    }

    public class PcStatusDto
    {
        public string PcId { get; set; }
        public string User { get; set; }
        public string TimeLeft { get; set; }
        public int TotalMinutes { get; set; }
        public string Status { get; set; }
    }

    public class CommandDto
    {
        public string Action { get; set; }
        public int Value { get; set; }
        public string Timestamp { get; set; }
    }

    public class CommandResponse
    {
        public string PcId { get; set; }
        public CommandDto[] Commands { get; set; }
    }
}
