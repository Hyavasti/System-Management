using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Timers;
using System.Windows.Input;
using ComputerShopClient.Models;
using ComputerShopClient.Services;

namespace ComputerShopClient.ViewModels
{
    public class DashboardViewModel : INotifyPropertyChanged
    {
        private readonly ApiService _apiService;
        private readonly Timer _statusTimer;
        private readonly Timer _commandTimer;
        
        public ObservableCollection<PcSession> PcSessions { get; set; }
        public event PropertyChangedEventHandler PropertyChanged;

        public DashboardViewModel()
        {
            _apiService = new ApiService("http://localhost:3000", "PC-01");
            
            PcSessions = new ObservableCollection<PcSession>
            {
                new PcSession 
                { 
                    PcId = "PC-01", 
                    User = "CurrentUser", 
                    TimeRemaining = TimeSpan.FromMinutes(85),
                    Status = "Active" 
                }
            };

            _statusTimer = new Timer(30000);
            _statusTimer.Elapsed += async (s, e) => await SendStatus();
            _statusTimer.Start();

            _commandTimer = new Timer(5000);
            _commandTimer.Elapsed += async (s, e) => await CheckCommands();
            _commandTimer.Start();
        }

        private async System.Threading.Tasks.Task SendStatus()
        {
            var session = PcSessions[0];
            var status = new PcStatusDto
            {
                PcId = session.PcId,
                User = session.User,
                TimeLeft = $"{session.TimeRemaining.Hours}h {session.TimeRemaining.Minutes}m",
                TotalMinutes = (int)session.TimeRemaining.TotalMinutes,
                Status = session.Status
            };

            await _apiService.SendStatusUpdate(status);
        }

        private async System.Threading.Tasks.Task CheckCommands()
        {
            var commands = await _apiService.GetPendingCommands();
            
            foreach (var cmd in commands)
            {
                ExecuteCommand(cmd);
            }
        }

        private void ExecuteCommand(CommandDto command)
        {
            var session = PcSessions[0];
            
            switch (command.Action)
            {
                case "addTime":
                    session.TimeRemaining = session.TimeRemaining.Add(TimeSpan.FromMinutes(command.Value));
                    break;
                    
                case "lock":
                    // Lock the computer
                    System.Windows.MessageBox.Show("PC Locked by Admin");
                    break;
                    
                case "unlock":
                    // Unlock the computer
                    System.Windows.MessageBox.Show("PC Unlocked by Admin");
                    break;
            }
        }

        protected void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
