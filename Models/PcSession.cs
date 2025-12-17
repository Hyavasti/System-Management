using System;
using System.ComponentModel;

namespace ComputerShopManagement.Models
{
    public enum SessionStatus
    {
        Active,
        Offline,
        OrderPending
    }

    public class PcSession : INotifyPropertyChanged
    {
        private string _pcName;
        private string _userName;
        private TimeSpan _timeRemaining;
        private SessionStatus _status;
        private double _progress;

        public string PcName
        {
            get => _pcName;
            set
            {
                _pcName = value;
                OnPropertyChanged(nameof(PcName));
            }
        }

        public string UserName
        {
            get => _userName;
            set
            {
                _userName = value;
                OnPropertyChanged(nameof(UserName));
            }
        }

        public TimeSpan TimeRemaining
        {
            get => _timeRemaining;
            set
            {
                _timeRemaining = value;
                OnPropertyChanged(nameof(TimeRemaining));
                OnPropertyChanged(nameof(FormattedTime));
            }
        }

        public SessionStatus Status
        {
            get => _status;
            set
            {
                _status = value;
                OnPropertyChanged(nameof(Status));
                OnPropertyChanged(nameof(FormattedTime));
            }
        }

        public double Progress
        {
            get => _progress;
            set
            {
                _progress = value;
                OnPropertyChanged(nameof(Progress));
            }
        }

        public string FormattedTime
        {
            get
            {
                if (Status == SessionStatus.Offline)
                    return "Offline";
                
                return $"{TimeRemaining.Hours}h {TimeRemaining.Minutes}m left";
            }
        }

        public event PropertyChangedEventHandler PropertyChanged;

        protected void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
