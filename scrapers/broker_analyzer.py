"""
Broker Analysis Utility
Analyzes broker performance from BizBuySell listings
Groups listings by broker and generates performance reports
"""

import json
import pandas as pd
import argparse
from pathlib import Path
from colorama import Fore, Style, init

# Initialize
init(autoreset=True)


class BrokerAnalyzer:
    def __init__(self, input_file='bizbuysell_all_listings.json'):
        self.input_file = input_file
        self.brokers = {}
        self.data = []

    def load_listings(self):
        """Load listings from JSON file"""
        print(f"{Fore.CYAN}[*] Loading listings from {self.input_file}...")

        try:
            with open(self.input_file, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
            print(f"{Fore.GREEN}[+] Loaded {len(self.data)} listings")
            return True
        except FileNotFoundError:
            print(f"{Fore.RED}[-] File not found: {self.input_file}")
            return False
        except json.JSONDecodeError as e:
            print(f"{Fore.RED}[-] Error decoding JSON: {e}")
            return False

    def group_by_broker(self):
        """Group listings by broker"""
        print(f"{Fore.CYAN}[*] Grouping listings by broker...")

        for listing in self.data:
            contactInfo = listing.get('contactInfo', {})
            if contactInfo:
                contactInfoPersonId = contactInfo.get('contactInfoPersonId', '')
                if contactInfoPersonId:
                    if contactInfoPersonId not in self.brokers:
                        self.brokers[contactInfoPersonId] = []
                    self.brokers[contactInfoPersonId].append(listing)

        print(f"{Fore.GREEN}[+] Found {len(self.brokers)} unique brokers")

    def save_brokers_json(self, output_file='brokers.json'):
        """Save brokers dictionary to JSON file"""
        print(f"{Fore.CYAN}[*] Saving brokers data to {output_file}...")

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.brokers, f, indent=4)

        print(f"{Fore.GREEN}[+] Brokers data saved to {output_file}")

    def generate_report(self, output_csv='brokers_report.csv', output_json='brokers_report.json'):
        """Generate broker performance report"""
        print(f"{Fore.CYAN}[*] Generating broker performance report...")

        # Sort brokers by number of listings (descending)
        ranked_brokers = sorted(self.brokers.items(), key=lambda item: len(item[1]), reverse=True)

        data = []
        for rank, (broker_id, listings) in enumerate(ranked_brokers, start=1):
            contact_info = listings[0].get('contactInfo', {})
            company_name = contact_info.get('brokerCompany') or contact_info.get('contactFullName') or "Unknown"

            contactFullName = contact_info.get('contactFullName')
            contactPhoneNumber = contact_info.get('contactPhoneNumber', {}).get("telephone", "")
            brokerProfileUrl = contact_info.get('brokerProfileUrl')

            # Calculate financial stats
            total_value = 0
            count_with_price = 0
            for listing in listings:
                price = listing.get('price')
                if price:
                    try:
                        # Remove $ and commas
                        if isinstance(price, str):
                            price = float(price.replace('$', '').replace(',', ''))
                        total_value += price
                        count_with_price += 1
                    except:
                        pass

            avg_price = total_value / count_with_price if count_with_price > 0 else 0

            data.append({
                "Rank": rank,
                "Broker Name": company_name,
                "Broker ID": broker_id,
                "Number of Listings": len(listings),
                "Listings with Price": count_with_price,
                "Total Value": total_value,
                "Average Price": avg_price,
                "Contact Full Name": contactFullName,
                "Contact Phone Number": contactPhoneNumber,
                "Broker Profile URL": brokerProfileUrl
            })

        # Create DataFrame
        df = pd.DataFrame(data)
        df = df.sort_values(by="Rank")

        # Save to CSV
        df.to_csv(output_csv, index=False)
        print(f"{Fore.GREEN}[+] Report saved to {output_csv}")

        # Save to JSON for easier parsing
        df.to_json(output_json, orient='records', indent=2)
        print(f"{Fore.GREEN}[+] Report saved to {output_json}")

        # Print top 10 brokers
        print(f"\n{Fore.CYAN}{'='*70}")
        print(f"{Fore.CYAN}TOP 10 BROKERS BY NUMBER OF LISTINGS")
        print(f"{Fore.CYAN}{'='*70}\n")

        for i, row in df.head(10).iterrows():
            print(f"{Fore.GREEN}#{row['Rank']} {row['Broker Name']}")
            print(f"   Listings: {row['Number of Listings']} | Avg Price: ${row['Average Price']:,.0f}")
            print(f"   Contact: {row['Contact Full Name']} | {row['Contact Phone Number']}")
            print(f"   Profile: {row['Broker Profile URL']}\n")

        return df

    def run(self, save_brokers_json=True, output_csv='brokers_report.csv', output_json='brokers_report.json'):
        """Main execution flow"""
        print(f"{Fore.CYAN}{'='*70}")
        print(f"{Fore.CYAN}Broker Analysis Utility")
        print(f"{Fore.CYAN}{'='*70}\n")

        # Load listings
        if not self.load_listings():
            return

        # Group by broker
        self.group_by_broker()

        # Save brokers JSON if requested
        if save_brokers_json:
            self.save_brokers_json()

        # Generate report
        df = self.generate_report(output_csv, output_json)

        # Print summary
        print(f"\n{Fore.GREEN}{'='*70}")
        print(f"{Fore.GREEN}ANALYSIS COMPLETE")
        print(f"{Fore.GREEN}{'='*70}")
        print(f"{Fore.GREEN}Total Listings: {len(self.data)}")
        print(f"{Fore.GREEN}Total Brokers: {len(self.brokers)}")
        print(f"{Fore.GREEN}Avg Listings per Broker: {len(self.data) / len(self.brokers):.1f}")
        print(f"{Fore.GREEN}{'='*70}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Broker Analysis Utility")
    parser.add_argument('--input', type=str, default='bizbuysell_all_listings.json',
                        help='Input JSON file with listings (default: bizbuysell_all_listings.json)')
    parser.add_argument('--output-csv', type=str, default='brokers_report.csv',
                        help='Output CSV file (default: brokers_report.csv)')
    parser.add_argument('--output-json', type=str, default='brokers_report.json',
                        help='Output JSON file (default: brokers_report.json)')
    parser.add_argument('--no-brokers-json', action='store_true',
                        help='Do not save intermediate brokers.json file')

    args = parser.parse_args()

    analyzer = BrokerAnalyzer(input_file=args.input)
    analyzer.run(
        save_brokers_json=not args.no_brokers_json,
        output_csv=args.output_csv,
        output_json=args.output_json
    )
